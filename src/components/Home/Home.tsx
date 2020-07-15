import React, { useState, useCallback, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card, Tabs, Tab, CardColumns } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Home.module.css'

const HomePage: React.FC = () => {
    const firebase = useFirebase()
    const session = useSession()

    const [allFeed, setAllFeed] = useState<any>(null)
    const [homeFeed, setHomeFeed] = useState<any>(null)
    const [academic, setAcademic] = useState<any>(null)
    const [bulletin, setBulletin] = useState<any>(null)
    const [channels, setChannels] = useState<Array<string>>([])

    const [allLoadingDone, setAllLoadingDone] = useState<boolean>(false);
    const [homeLoadingDone, setHomeLoadingDone] = useState<boolean>(false);
    const [acadLoadingDone, setAcadLoadingDone] = useState<boolean>(false);
    const [bulLoadingDone, setBulLoadingDone] = useState<boolean>(false);

    const [nowSeconds, setNowSeconds] = useState<number>(0);

    useEffect(() => {
        var now = new Date();
        var seconds = ((now.getTime()) * .001) >> 0;
        setNowSeconds(seconds);

        console.log(seconds)
        //retrieves the most recent 10 posts
        const getChannels = async () => {
            try {
                const user = await firebase.db.collection('users').doc(session.auth?.uid).get()
                console.log('user = ', user.data())
                const channelList = user.data()?.actives
                console.log('channelList = ', channelList)
                console.log('object.keys() = ', Object.keys(channelList).filter((key) => {
                    return channelList[key] == true;
                }))
                return Object.keys(channelList).filter((key) => {
                    return channelList[key] == true;
                })
            } catch (e) {
                console.log(e)
            }
        }

        const getPosts = async (sort: string, category: string, subjects: string[] | undefined) => {
            try {
                var docList: any[] = []
                const query = firebase.db.collection('posts').orderBy(sort, "desc")

                let posts = null;
                console.log('subjects =', subjects)
                if (subjects == undefined || subjects?.length == 0) {
                    if (category === 'home') {
                        posts = null
                        setHomeLoadingDone(true)
                    } else {
                        posts = await query.limit(10).get()
                    }


                } else {
                    if (category === 'home') {
                        posts = await query.where('channels', 'array-contains-any', subjects).limit(10).get()
                        console.log('posts = ', posts)
                    } else {
                        posts = await query.limit(10).get()
                    }
                }

                if (posts?.empty || posts == null) {
                    console.log('No matching documents')
                    return;
                }

                posts.forEach(doc => {
                    docList = [...docList, { id: doc.id, data: doc.data() }];
                });

                for (let i = 0; i < docList.length; i++) {
                    const doc = docList[i]
                    const numComments = await firebase.db.collection('comments').where('parent', '==', doc.id).get()
                    docList[i] = { id: doc.id, data: doc.data, numComments: numComments.size }
                }

                if (category === 'all') {
                    setAllFeed(docList)
                    setAllLoadingDone(true)
                }
                if (category === 'home') {
                    setHomeFeed(docList)
                    setHomeLoadingDone(true)
                }
                if (category === 'academic') {
                    setAcademic(docList)
                    setAcadLoadingDone(true)
                }
                if (category === 'bulletin') {
                    setBulletin(docList)
                    setBulLoadingDone(true)
                }
            } catch (e) {
                console.log(e)
            }
        }

        const loadPosts = async () => {
            let subjects: string[] | undefined = []
            if (session.auth) {
                subjects = await getChannels()
            }

            if (subjects == [] || subjects == undefined) {
                getPosts('timestamp.seconds', 'all', undefined)
                getPosts('timestamp.seconds', 'home', undefined)
                getPosts('timestamp.seconds', 'academic', undefined)
                getPosts('timestamp.seconds', 'bulletin', undefined)
            } else {
                getPosts('timestamp.seconds', 'all', subjects)
                getPosts('timestamp.seconds', 'home', subjects)
                getPosts('timestamp.seconds', 'academic', subjects)
                getPosts('timestamp.seconds', 'bulletin', subjects)
            }
            console.log('subjects = ', subjects)
        }

        loadPosts()
    }, [session, firebase])

    //a feed object
    const feedCard = (object: { id: string | number | undefined; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string; channels: Array<string>; authorName: string }; numComments: number }) => {

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
                    <a href={`/post/${object.id}`}>
                        <Card.Title>{object.data.title}</Card.Title>
                    </a>
                    <Card.Subtitle>{channelView()}</Card.Subtitle>
                    <Card.Text className={styles.fontLess}> {object.data.desc}</Card.Text>
                    <Card.Text className={styles.fontLess}>
                        {object.numComments == 1 ?
                            <a href={`/post/${object.id}`}>{object.numComments} comment</a>
                            :
                            <a href={`/post/${object.id}`}>{object.numComments} comments</a>
                        }

                        {' '} - posted by <a href={`/user/${object.data.authorName}`}>{`@${object.data.authorName}`}</a> - {message}
                    </Card.Text>
                </Card.Body>
            </Card>

            //
        )
    }

    //loading animation while retrieving feed
    const feedLoadingView = () => {
        return (
            <div style={{ paddingTop: 15 }}>

                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title></Card.Title>
                        <Card.Text></Card.Text>
                        <Spinner animation="border" />
                    </Card.Body>
                </Card>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title></Card.Title>
                        <Card.Text></Card.Text>
                        <Spinner animation="border" />
                    </Card.Body>
                </Card>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title></Card.Title>
                        <Card.Text></Card.Text>
                        <Spinner animation="border" />
                    </Card.Body>
                </Card>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title></Card.Title>
                        <Card.Text></Card.Text>
                        <Spinner animation="border" />
                    </Card.Body>
                </Card>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title></Card.Title>
                        <Card.Text></Card.Text>
                        <Spinner animation="border" />
                    </Card.Body>
                </Card>
            </div>

        )
    }

    //list of feed objects
    const feedView = (feedList: { id: string | number | undefined; data: { title: string; desc: string; timestamp: { seconds: number; nanoseconds: number }; author: string; channels: string[]; authorName: string }; numComments: number }[]) => {
        const feedItems = feedList.map((object: { id: string | number | undefined; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string; channels: Array<string>; authorName: string }; numComments: number }) => <div key={object.id} style={{ paddingTop: 15 }}>{feedCard(object)}</div>
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
                            <Button href="/new" variant="outline-dark" style={{ marginRight: 10 }}>Create Post</Button>
                            <Button variant="light" onClick={() => {
                                firebase.doSignOut()
                                window.location.reload()
                            }}>
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
            <Container className={styles.paddingTop}>
                <Row>
                    <Col>
                        <h1 style={{ paddingLeft: 22, paddingBottom: 15 }}>Feed</h1>
                    </Col>
                    <Col>

                    </Col>
                </Row>
                <Tabs defaultActiveKey={session.auth ? 'Home' : 'All'} id="feed-nav">
                    <Tab eventKey="All" title="All">
                        {
                            allFeed ?
                                feedView(allFeed)
                                :
                                allLoadingDone ?
                                    <Card style={{ marginTop: 15 }}>
                                        <Card.Body>
                                            <Card.Text>We're encounter errors. Try again later?</Card.Text>
                                        </Card.Body>
                                    </Card>
                                    :
                                    feedLoadingView()
                        }
                    </Tab>
                    <Tab eventKey="Home" title="Home">
                        {
                            homeFeed ?
                                feedView(homeFeed)
                                :
                                homeLoadingDone ?
                                    session.auth ?
                                        <Card style={{ marginTop: 15 }}>
                                            <Card.Body>
                                                <Card.Text>Subscribe to channels in your Profile page.</Card.Text>
                                            </Card.Body>
                                        </Card>
                                        :
                                        <Card style={{ marginTop: 15 }}>
                                            <Card.Body>
                                                <Card.Text>Create an account to subscribe to specific channels.</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    :
                                    feedLoadingView()
                        }
                    </Tab>
                    <Tab eventKey="Academic" title="Academic">
                        {
                            academic ?
                                feedView(academic)
                                :
                                acadLoadingDone ?
                                    session.auth ?
                                        <Card style={{ marginTop: 15 }}>
                                            <Card.Body>
                                                <Card.Text>Subscribe to channels in your Profile page.</Card.Text>
                                            </Card.Body>
                                        </Card>
                                        :
                                        <Card style={{ marginTop: 15 }}>
                                            <Card.Body>
                                                <Card.Text>Create an account to subscribe to specific channels.</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    :
                                    feedLoadingView()
                        }
                    </Tab>
                    <Tab eventKey="Bulletin" title="Bulletin">
                        {
                            bulletin ?
                                feedView(bulletin)
                                :
                                bulLoadingDone ?
                                    <Card style={{ marginTop: 15 }}>
                                        <Card.Body>
                                            <Card.Text>We're encounter errors. Try again later?</Card.Text>
                                        </Card.Body>
                                    </Card>
                                    :
                                    feedLoadingView()
                        }
                    </Tab>
                </Tabs>
            </Container>
        </div>
    )
}

export { HomePage }
