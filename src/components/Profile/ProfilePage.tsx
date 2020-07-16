import React, { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { useFirebase, Firebase } from '../Firebase'
import { firestore } from 'firebase'
import { Navbar, Nav, Button, DropdownButton, Dropdown, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Profile.module.css'

const ProfilePage: React.FC = () => {
    const { username } = useParams()
    const firebase = useFirebase()
    const session = useSession()

    const [user, setUser] = useState<any>(null);
    const [userLoading, setUserLoading] = useState<boolean>(true);

    const [userSelf, setUserSelf] = useState<boolean>(false);
    const [editSubjects, setEditSubjects] = useState<boolean>(false);

    const [change, setChange] = useState<boolean>(false);
    const [lang, setLang] = useState<boolean>(false)
    const [sci, setSci] = useState<boolean>(false)
    const [ss, setSS] = useState<boolean>(false);

    const [history, setHistory] = useState<any>(null);


    //list of subjects
    const [actives, setActives] = useState<any>({});

    useEffect(() => {
        const getUser = async () => {
            const results = await firestore().collection('users').where('username', '==', username).limit(1).get();
            if (results.empty) {
                console.log('empty');
                setUserLoading(false);
            } else {

                const userID = await results.docs[0].id
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
                console.log('userResults = ', userResults)
                console.log('userResults.uid = ', userResults.uid)

                const getPosts = async (sort: string) => {
                    try {
                        var docList: any[] = []
                        const posts = await firebase.db.collection('posts').orderBy(sort, "desc").where('author', '==', userID).limit(10).get()


                        if (posts.empty || posts == null) {
                            console.log('No matching documents')
                            return;
                        }
                        posts.forEach(doc => {
                            docList = [...docList, { id: doc.id, data: doc.data() }];
                        });

                        setHistory(docList)
                        console.log('docList = ', docList)

                    } catch (e) {
                        console.log(e)
                    }
                }


                getPosts('timestamp.seconds');
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
            }


            getSelf();
        }

    }, [session, firebase])

    const subjectsView = () => {
        const subjectObjects = Object.entries(actives).map(([keyName, keyIndex]) =>
            // use keyName to get current key's name
            // and a[keyName] to get its value
            <div key={keyName}>
                {actives[keyName] ?
                    <Button active variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}>{keyName}</Button>
                    :
                    <div></div>
                }

            </div>
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

        var bus = actives['Business']
        return (
            <Row style={{ paddingTop: 15, paddingLeft: 15 }}>
                <Button active={actives['Arts']} variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Arts')
                        setChange(!change);
                    }}
                >
                    Arts
                </Button>
                <Button active={actives['Business']} variant='outline-dark' style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Business')
                        setChange(!change);
                    }}
                >
                    Business</Button>
                <Button variant='outline-dark' active={actives['Computer Science']} style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Computer Science')
                        setChange(!change);
                    }}
                >
                    Computer Science
                </Button>
                <Button variant='outline-dark' active={actives['Economics']} style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Economics')
                        setChange(!change);
                    }}
                >
                    Economics</Button>
                <Button variant='outline-dark' active={actives['Finance']} style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Finance')
                        setChange(!change);
                    }}
                >
                    Finance</Button>
                <Button variant='outline-dark' active={actives['History']} style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('History')
                        setChange(!change);
                    }}
                >
                    History</Button>
                <Button variant='outline-dark' active={actives['Humanities']} style={{ marginRight: 15, marginBottom: 15 }}
                    onClick={() => {
                        subjectEdit('Humanities')
                        setChange(!change);
                    }}
                >
                    Humanities</Button>
                <DropdownButton id="lang" title="Languages" variant={lang ? 'dark' : 'outline-dark'} style={{ marginRight: 15, marginBottom: 15 }}>
                    <Dropdown.Item active={actives['French']} onClick={() => {
                        subjectEdit('French')
                        setChange(!change);
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
                        setChange(!change);
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
                        setChange(!change);
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
                        setChange(!change);
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
                    setChange(!change);
                }}>
                    Mathematics
                </Button>
                <DropdownButton id="sci" title="Sciences" variant={sci ? 'dark' : 'outline-dark'} style={{ marginRight: 15, marginBottom: 15 }}>
                    <Dropdown.Item active={actives['Biology']} onClick={() => {
                        subjectEdit('Biology')
                        setChange(!change);
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
                        setChange(!change);
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
                        setChange(!change);
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
                        setChange(!change);
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
                        setChange(!change);
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
                        setChange(!change);
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
                        setChange(!change);
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
                    setChange(!change);
                }}>General</Button>
            </Row>
        )
    }

    //a feed object
    const feedCard = (object: { id: string | number | undefined; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string; channels: Array<string>; authorName: string } }) => {

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
                    <a href={`/post/${object.id}`}>
                        <Card.Title>{object.data.title}</Card.Title>
                    </a>
                    <Card.Subtitle>{channelView()}</Card.Subtitle>
                    <Card.Text className={styles.fontLess}> {object.data.desc}</Card.Text>
                    <Card.Text className={styles.fontLess}>Posted by {`@${object.data.authorName}`} at {object.data.timestamp.seconds}</Card.Text>
                </Card.Body>
            </Card>

            //
        )
    }

    //list of feed objects
    const feedView = (feedList: { id: string | number | undefined; data: { title: string; desc: string; timestamp: { seconds: number; nanoseconds: number }; author: string; channels: string[]; authorName: string } }[]) => {
        const feedItems = feedList.map((object: { id: string | number | undefined; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string; channels: Array<string>; authorName: string } }) => <div key={object.id} style={{ paddingTop: 15 }}>{feedCard(object)}</div>
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
                            <Button href="/post" variant="outline-dark" style={{ marginRight: 10 }}>Create Post</Button>
                            <Button variant="light" onClick={() => { firebase.doSignOut() }}>
                                sign out
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
                    <Spinner animation="border" />
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
                                        <h3>Credits: </h3>
                                    </Col>
                                </Row>


                                <hr></hr>

                                <Row style={{ paddingLeft: 15 }}>
                                    <h3 style={{ paddingRight: 15 }}>Channels</h3>
                                    {userSelf ?
                                        editSubjects ?
                                            <Button variant="outline-dark" onClick={async () => {
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

                        {history
                            ?
                            <div>
                                <h2 style={{ marginTop: 40, marginLeft: 20 }}>Post History</h2>
                                {feedView(history)}
                            </div>

                            :
                            <div></div>
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
