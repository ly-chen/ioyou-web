import React, { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { useFirebase, Firebase } from '../Firebase'
import { firestore } from 'firebase'
import { Navbar, Nav, Button, DropdownButton, Dropdown, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Profile.module.css'
import { StringLocale } from 'yup';
import { NavBar } from '../../constants'
import { FeedView } from '../../constants'

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


    return (
        <div>
            <NavBar />
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

                                <FeedView feedList={history} nowSeconds={nowSeconds} userDoc={userSelfDoc} upvoted={upvoted} downvoted={downvoted} setUpvoted={setUpvoted} setDownvoted={setDownvoted} setChanged={setChanged} changed={changed} />
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
