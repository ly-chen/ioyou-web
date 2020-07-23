import React, { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { useFirebase, Firebase } from '../Firebase'
import { firestore } from 'firebase'
import { Navbar, Nav, Button, DropdownButton, Dropdown, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Profile.module.css'
import { StringLocale } from 'yup';

const ProfilePage: React.FC = () => {
    const { username } = useParams()
    const firebase = useFirebase()
    const session = useSession()

    const [user, setUser] = useState<any>(null);
    const [userid, setUserid] = useState<string>('')
    const [userLoading, setUserLoading] = useState<boolean>(true);

    const [userSelf, setUserSelf] = useState<boolean>(false);
    const [userSelfDoc, setUserSelfDoc] = useState<any>(null);
    const [upvoted, setUpvoted] = useState<string[]>([])
    const [downvoted, setDownvoted] = useState<string[]>([])
    const [editSubjects, setEditSubjects] = useState<boolean>(false);

    const [changed, setChanged] = useState<boolean>(false);
    const [lang, setLang] = useState<boolean>(false)
    const [sci, setSci] = useState<boolean>(false)
    const [ss, setSS] = useState<boolean>(false);

    const [history, setHistory] = useState<any[] | null>(null);

    const [historyDone, setHistoryDone] = useState<boolean>(false);

    const [nowSeconds, setNowSeconds] = useState<number>(0);

    const [lastPost, setLastPost] = useState<any>(null)

    const [sort, setSort] = useState<string>('timestamp.seconds')


    //list of subjects
    const [actives, setActives] = useState<any>({});

    const sortButton = (sort: string) => {
        const handleSort = async (sort: string) => {
            setLastPost(null)
            setHistory(null)
            setHistoryDone(false)
            await getPosts(sort, userid, null, null)
            setSort(sort)
        }

        return (
            <DropdownButton id="sort" title={sort == 'timestamp.seconds' ? 'Most Recent' : 'Top Rated'} variant='light' style={{ paddingBottom: 15 }}>
                <Dropdown.Item active={sort == 'timestamp.seconds'}
                    onClick={async () => {
                        if (sort == 'timestamp.seconds') {
                            return
                        } else {
                            handleSort('timestamp.seconds')
                            setChanged(!changed)
                        }
                    }}
                >
                    Most Recent
                                        </Dropdown.Item>
                <Dropdown.Item active={sort == 'upvotes'}
                    onClick={async () => {
                        if (sort == 'upvotes') {
                            return
                        } else {
                            handleSort('upvotes')
                            setChanged(!changed)
                        }
                    }}
                >
                    Top of All Time
                                        </Dropdown.Item>
            </DropdownButton>
        )
    }

    const getPosts = async (sort: string, userID: string, last: any | null, history: any[] | null) => {
        try {
            var docList: any[] = []
            var query = firebase.db.collection('posts').where('author', '==', userID).orderBy(sort, "desc");

            if (last) {
                console.log('lastPost = ', last)
                const lastTime = sort == 'timestamp.seconds' ? last.data.timestamp.seconds : last.data.upvotes

                console.log('lastTime = ', lastTime)
                query = query.startAfter(lastTime)
            }

            const posts = await query.limit(10).get()


            if (posts.empty || posts == null) {
                console.log('No matching documents')
                setHistoryDone(true);
                return;
            }
            posts.forEach(doc => {
                docList = [...docList, { id: doc.id, data: doc.data() }];
            });

            for (let i = 0; i < docList.length; i++) {
                const doc = docList[i]
                const numComments = await firebase.db.collection('comments').where('thread', '==', doc.id).get()
                docList[i] = { id: doc.id, data: doc.data, numComments: numComments.size }
            }

            const lastDoc = docList[docList.length - 1]
            setLastPost(lastDoc)

            if (history) {
                await setHistory([...history, ...docList])
            } else {
                await setHistory(docList)
            }

            console.log('docList = ', docList)
            setHistoryDone(true)
        } catch (e) {
            console.log(e)
            setHistoryDone(true)
        }
    }

    useEffect(() => {
        var now = new Date();
        var seconds = ((now.getTime()) * .001) >> 0;
        setNowSeconds(seconds);

        const getUser = async () => {
            const results = await firestore().collection('users').where('username', '==', username).limit(1).get();
            if (results.empty) {
                console.log('empty');
                setUserLoading(false);
            } else {

                const userID = await results.docs[0].id
                setUserid(userID)
                const userResults = await results.docs[0].data()
                setUser(userResults)
                setActives(userResults.actives)

                if (userResults.actives) {
                    if (userResults.actives['French'] || userResults.actives['Mandarin'] || userResults.actives['Spanish'] || userResults.actives['Languages (General)']) {
                        setLang(true)
                    }

                    if (userResults.actives['Biology'] || userResults.actives['Chemistry'] || userResults.actives['Physics'] || userResults.actives['Sciences (General)']) {
                        setSci(true)
                    }

                    if (userResults.actives['Psychology'] || userResults.actives['Sociology'] || userResults.actives['Social Sciences (General)']) {
                        setSS(true)
                    }
                }


                getPosts('timestamp.seconds', userID, lastPost, history);
                setUserLoading(false);
            }
        }

        getUser();

        if (session.auth) {
            const getSelf = async () => {
                const self = await firestore().collection('users').doc(session?.auth?.uid).get()
                if (self?.data()?.username == username) {
                    setUserSelf(true);
                }
                setUserSelfDoc(self.data());
                setUpvoted(self.data()?.upvoted)
                setDownvoted(self.data()?.downvoted)
            }


            getSelf();
        }

    }, [session, firebase])

    const subjectsView = () => {

        const subjectObjects = Object.entries(actives).map(([keyName, keyIndex]) =>
            // use keyName to get current key's name
            // and a[keyName] to get its value
            actives[keyName] ?
                keyName == 'bulletin' ?
                    <div key={keyName}></div>
                    :
                    <Button key={keyName} active variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>{keyName}</Button>
                :
                <div key={keyName}></div>

        )

        return (
            <Row style={{ paddingTop: 15, paddingLeft: 15 }}>
                {subjectObjects}
            </Row>
        )
    }

    const subjectEdit = (subject: string) => {
        let activesEdit = actives;
        if (actives[subject] == true) {
            activesEdit[subject] = false;
            setActives(activesEdit)
        } else {
            activesEdit[subject] = true;
            setActives(activesEdit);
        }
    }


    const editSubjectsView = () => {

        return (
            <Row style={{ paddingTop: 15, paddingLeft: 15 }}>
                <Button active={actives['Arts']} variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Arts')
                        setChanged(!changed);
                    }}
                >
                    Arts
                </Button>
                <Button active={actives['Business']} variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Business')
                        setChanged(!changed);
                    }}
                >
                    Business</Button>
                <Button variant='outline-dark' active={actives['Computer Science']} style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Computer Science')
                        setChanged(!changed);
                    }}
                >
                    Computer Science
                </Button>
                <Button variant='outline-dark' active={actives['Economics']} style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Economics')
                        setChanged(!changed);
                    }}
                >
                    Economics</Button>
                <Button variant='outline-dark' active={actives['Finance']} style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Finance')
                        setChanged(!changed);
                    }}
                >
                    Finance</Button>
                <Button variant='outline-dark' active={actives['History']} style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('History')
                        setChanged(!changed);
                    }}
                >
                    History</Button>
                <Button variant='outline-dark' active={actives['Humanities']} style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Humanities')
                        setChanged(!changed);
                    }}
                >
                    Humanities</Button>
                <DropdownButton id="lang" title="Languages" variant={lang ? 'dark' : 'outline-dark'} style={{ marginRight: 15, marginBottom: 15 }}>
                    <Dropdown.Item active={actives['French']} onClick={() => {
                        subjectEdit('French')
                        setChanged(!changed);
                        if (actives['French'] || actives['Mandarin'] || actives['Spanish'] || actives['Languages (General)']) {
                            setLang(true)
                        } else {
                            setLang(false)
                        }
                    }}>
                        French
                    </Dropdown.Item>
                    <Dropdown.Item active={actives['Mandarin']} onClick={() => {
                        subjectEdit('Mandarin')
                        setChanged(!changed);
                        if (actives['French'] || actives['Mandarin'] || actives['Spanish'] || actives['Languages (General)']) {
                            setLang(true)
                        } else {
                            setLang(false)
                        }
                    }}>
                        Mandarin
                    </Dropdown.Item >
                    <Dropdown.Item active={actives['Spanish']} onClick={() => {
                        subjectEdit('Spanish')
                        setChanged(!changed);
                        if (actives['French'] || actives['Mandarin'] || actives['Spanish'] || actives['Languages (General)']) {
                            setLang(true)
                        } else {
                            setLang(false)
                        }
                    }}>
                        Spanish
                    </Dropdown.Item>
                    <Dropdown.Item active={actives['Languages (General)']} onClick={() => {
                        subjectEdit('Languages (General)')
                        setChanged(!changed);
                        if (actives['French'] || actives['Mandarin'] || actives['Spanish'] || actives['Languages (General)']) {
                            setLang(true)
                        } else {
                            setLang(false)
                        }
                    }}>
                        General
                    </Dropdown.Item>
                </DropdownButton>
                <Button variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }} active={actives['Mathematics']} onClick={() => {
                    subjectEdit('Mathematics')
                    setChanged(!changed);
                }}>
                    Mathematics
                </Button>
                <DropdownButton id="sci" title="Sciences" variant={sci ? 'dark' : 'outline-dark'} style={{ marginRight: 15, marginBottom: 15 }}>
                    <Dropdown.Item active={actives['Biology']} onClick={() => {
                        subjectEdit('Biology')
                        setChanged(!changed);
                        if (actives['Biology'] || actives['Chemistry'] || actives['Physics'] || actives['Sciences (General)']) {
                            setSci(true)
                        } else {
                            setSci(false)
                        }
                    }}>
                        Biology
                    </Dropdown.Item>
                    <Dropdown.Item active={actives['Chemistry']} onClick={() => {
                        subjectEdit('Chemistry')
                        setChanged(!changed);
                        if (actives['Biology'] || actives['Chemistry'] || actives['Physics'] || actives['Sciences (General)']) {
                            setSci(true)
                        } else {
                            setSci(false)
                        }
                    }}>
                        Chemistry
                    </Dropdown.Item>
                    <Dropdown.Item active={actives['Physics']} onClick={() => {
                        subjectEdit('Physics')
                        setChanged(!changed);
                        if (actives['Biology'] || actives['Chemistry'] || actives['Physics'] || actives['Sciences (General)']) {
                            setSci(true)
                        } else {
                            setSci(false)
                        }
                    }}>
                        Physics
                    </Dropdown.Item>
                    <Dropdown.Item active={actives['Sciences (General)']} onClick={() => {
                        subjectEdit('Sciences (General)')
                        setChanged(!changed);
                        if (actives['Biology'] || actives['Chemistry'] || actives['Physics'] || actives['Sciences (General)']) {
                            setSci(true)
                        } else {
                            setSci(false)
                        }
                    }}>
                        General
                    </Dropdown.Item>
                </DropdownButton>
                <DropdownButton id="lang" title="Social Sciences" variant={ss ? 'dark' : 'outline-dark'} style={{ marginRight: 15, marginBottom: 15 }} >
                    <Dropdown.Item active={actives['Psychology']} onClick={() => {
                        subjectEdit('Psychology')
                        setChanged(!changed);
                        if (actives['Psychology'] || actives['Sociology'] || actives['Social Sciences (General)']) {
                            setSS(true)
                        } else {
                            setSS(false)
                        }
                    }}>
                        Psychology
                    </Dropdown.Item>
                    <Dropdown.Item active={actives['Sociology']} onClick={() => {
                        subjectEdit('Sociology')
                        setChanged(!changed);
                        if (actives['Psychology'] || actives['Sociology'] || actives['Social Sciences (General)']) {
                            setSS(true)
                        } else {
                            setSS(false)
                        }
                    }}>
                        Sociology
                    </Dropdown.Item>
                    <Dropdown.Item active={actives['Social Sciences (General)']} onClick={() => {
                        subjectEdit('Social Sciences (General)')
                        setChanged(!changed);
                        if (actives['Psychology'] || actives['Sociology'] || actives['Social Sciences (General)']) {
                            setSS(true)
                        } else {
                            setSS(false)
                        }
                    }}>
                        General
                    </Dropdown.Item>
                </DropdownButton>
                <Button variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }} active={actives['General']} onClick={() => {
                    subjectEdit('General')
                    setChanged(!changed);
                }}>General</Button>
            </Row>
        )
    }

    const handleVote = (upvoteTrue: boolean, object: any) => {
        var collect = 'posts'
        var upvoteList: string[] = []
        var downvoteList: string[] = []
        var upvoteIndex = -1
        var downvoteIndex = -1

        if (userSelfDoc.upvoted) {
            upvoteList = upvoted
            upvoteIndex = upvoteList.indexOf(object.id)
        }
        if (userSelfDoc.downvoted) {
            downvoteList = downvoted
            downvoteIndex = downvoteList.indexOf(object.id)
        }


        var upvotes: number;
        if (object.data.upvotes) {
            upvotes = object.data.upvotes
        } else {
            upvotes = 0
        }

        if (upvoteTrue) {

            if (upvoteIndex == -1) {
                if (downvoteIndex != -1) {
                    downvoteList.splice(downvoteIndex, 1)
                    firebase.db.collection('users').doc(session.auth?.uid).update({ downvoted: downvoteList })
                    upvotes = upvotes + 1
                }
                upvoteList = [...upvoteList, object.id]
                console.log('upvoteList after adding = ', upvoteList)
                upvotes = upvotes + 1

            } else {
                upvoteList.splice(upvoteIndex, 1)
                console.log('upvoteList after splice = ', upvoteList)
                upvotes = upvotes - 1
            }
            firebase.db.collection('users').doc(session.auth?.uid).update({ upvoted: upvoteList })

            firebase.db.collection(collect).doc(object.id).update({ upvotes: upvotes })
            object.data.upvotes = upvotes;
        } else {
            if (downvoteIndex == -1) {
                if (upvoteIndex != -1) {
                    upvoteList.splice(upvoteIndex, 1)
                    firebase.db.collection('users').doc(session.auth?.uid).update({ upvoted: upvoteList })
                    upvotes = upvotes - 1
                }
                downvoteList = [...downvoteList, object.id]
                console.log('downvoteList after adding = ', downvoteList)
                upvotes = upvotes - 1
            } else {
                downvoteList.splice(downvoteIndex, 1)
                console.log('downvoteList after splice = ', downvoteList)
                upvotes = upvotes + 1
            }


            firebase.db.collection('users').doc(session.auth?.uid).update({ downvoted: downvoteList })
            firebase.db.collection(collect).doc(object.id).update({ upvotes: upvotes })
            object.data.upvotes = upvotes;
        }


        if (upvoteList) {
            setUpvoted(upvoteList)
        }
        if (downvoteList) {
            setDownvoted(downvoteList)
        }
    }

    //a feed object
    const feedCard = (object: { id: string; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string; channels: Array<string>; authorName: string, upvotes: number }; numComments: number }) => {

        var time = nowSeconds - object.data.timestamp.seconds;
        var message = ''
        if (time < 120) {
            message = 'about a minute ago'
        } else if (time < 3600) {
            message = `${Math.floor(time / 60)} minutes ago`
        } else if (time < 86400) {
            let curTime = Math.floor(time / 3600)
            if (curTime == 1) {
                message = 'about an hour ago'
            } else {
                message = `${curTime} hours ago`
            }
        } else {
            let curTime = Math.floor(time / 86400)
            if (curTime == 1) {
                message = 'yesterday'
            } else {
                message = `${curTime} days ago`
            }
        }

        const channelView = () => {
            const subjectObjects = object.data.channels?.map((d) => <p key={d}>{(object.data.channels.indexOf(d) == 0) ? `#${d}` : `, #${d}`}</p>)
            return (
                <div>
                    <Row style={{ marginLeft: 1 }}>{subjectObjects}</Row>

                </div>
            )
        }

        return (

            <Card style={{ marginBottom: 20 }}>
                <Card.Body>
                    <Row>
                        <Col>
                            <a href={`/post/${object.id}`}>
                                <Card.Title>{object.data.title}</Card.Title>
                            </a>
                            <Card.Subtitle>{channelView()}</Card.Subtitle>
                            <Card.Text className={styles.fontLess}> {object.data.desc}</Card.Text>
                        </Col>
                        <Col xs={3} sm={2} style={{ textAlign: 'center' }}>
                            <Button disabled={!session.auth} size="sm" active={upvoted.includes(object.id)} variant="outline-primary" onClick={() => {
                                handleVote(true, object)
                                setChanged(!changed)
                            }}>
                                ▲
                            </Button>
                            <p>{object.data.upvotes ?
                                object.data.upvotes
                                :
                                0
                            }
                            </p>
                            <Button disabled={!session.auth} size="sm" active={downvoted.includes(object.id)} variant="outline-danger" onClick={() => {
                                handleVote(false, object)
                                setChanged(!changed)
                            }}>▼</Button>
                        </Col>
                    </Row>
                    <Card.Text className={styles.fontLess}>{object.numComments == 1 ?
                        <a href={`/post/${object.id}`}>{object.numComments} comment</a>
                        :
                        <a href={`/post/${object.id}`}>{object.numComments} comments</a>
                    }

                        {' '} - posted by <a href={`/user/${object.data.authorName}`}>{`@${object.data.authorName}`}</a> - {message}</Card.Text>
                </Card.Body>
            </Card>

            //
        )
    }

    //list of feed objects
    const feedView = (feedList: { id: string; data: { title: string; desc: string; timestamp: { seconds: number; nanoseconds: number }; author: string; channels: string[]; authorName: string, upvotes: number }; numComments: number }[]) => {
        const feedItems = feedList.map((object: { id: string; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string; channels: Array<string>; authorName: string, upvotes: number }; numComments: number }) => <div key={object.id} >{feedCard(object)}</div>
        )
        return feedItems
    }


    return (
        <div>
            <Navbar bg="light" variant="light">
                <Navbar.Brand href="/">
                    {' '}
                            ioyou
                    </Navbar.Brand>
                <Nav className="ml-auto">
                    {session.auth ?
                        <div>
                            <Button variant="light" onClick={async () => {
                                const user = await firebase.db.collection('users').doc(session?.auth?.uid).get()
                                const username = user?.data()?.username
                                window.location.href = `/user/${username}`
                            }} style={{ marginRight: 10 }}>
                                Profile
                            </Button>
                            <Button href="/new" variant="outline-dark" style={{ marginRight: 10 }}>Post</Button>
                            <Button variant="light" onClick={() => {
                                setUserSelf(false);
                                firebase.doSignOut()
                            }}>
                                Sign Out
                            </Button>
                        </div>

                        :
                        <div>
                            <Button variant="outline-dark" href="/login" style={{ marginRight: 10 }}>
                                log in
                                </Button>

                            <Button variant="light" href="/signup">
                                sign up
                                </Button>
                        </div>
                    }

                </Nav>
            </Navbar>
            {userLoading ?
                <Container className={styles.paddingTop}>
                    <Spinner style={{ marginTop: 30, marginLeft: 30 }} animation="border" />
                </Container>
                :
                user ?
                    <Container className={styles.paddingTop}>
                        <Card>
                            <Card.Body>
                                <Row>
                                    <Col>
                                        <h2>@{username}</h2>
                                        <h2>{user.name}</h2>
                                    </Col>
                                    <Col>
                                        {user.credits == 1 ?
                                            <h3>1 credit</h3>
                                            :
                                            <h3>{user.credits} credits</h3>
                                        }

                                    </Col>
                                </Row>


                                <hr></hr>

                                <Row style={{ paddingLeft: 15 }}>
                                    <h3 style={{ paddingRight: 15 }}>Channels</h3>
                                    {userSelf ?
                                        editSubjects ?
                                            <Button variant="primary" onClick={async () => {
                                                setEditSubjects(false)
                                                await firestore().collection('users').doc(session.auth?.uid).update({ actives: actives })

                                            }}>Save</Button>
                                            :
                                            <Button variant="outline-dark" onClick={() => { setEditSubjects(true) }}>Edit</Button>
                                        :
                                        <div></div>
                                    }
                                </Row>
                                {
                                    editSubjects ?
                                        editSubjectsView()
                                        :
                                        actives ?
                                            subjectsView()
                                            :
                                            <div></div>
                                }
                            </Card.Body>

                        </Card>

                        <h2 style={{ paddingTop: 50, paddingLeft: 22, paddingBottom: 15 }}>Post History</h2>

                        {sortButton(sort)}

                        {history
                            ?
                            <div>

                                {feedView(history)}
                                <Button variant='light' onClick={() => { getPosts(sort, userid, lastPost, history) }}>Load more</Button>
                            </div>
                            :
                            historyDone ?
                                <h3 style={{ paddingTop: 15 }}>No posts.</h3>
                                :
                                <div style={{ marginTop: 15 }}>
                                    <Spinner style={{ marginTop: 30, marginLeft: 30 }} animation="border" />
                                </div>

                        }

                    </Container>
                    :
                    <Container className={styles.paddingTop}>
                        <h1>User does not exist.</h1>
                    </Container>
            }



        </div>
    )
}

export { ProfilePage }
