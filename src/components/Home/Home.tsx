import React, { useState, useCallback, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { functions, auth, firestore } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card, Tabs, Tab, DropdownButton, Dropdown, } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Home.module.css'

const HomePage: React.FC = () => {
    const firebase = useFirebase()
    const session = useSession()

    const [allFeed, setAllFeed] = useState<any[]>([])
    const [homeFeed, setHomeFeed] = useState<any[]>([])
    const [academic, setAcademic] = useState<any[]>([])
    const [bulletin, setBulletin] = useState<any[]>([])
    const [channels, setChannels] = useState<string[] | undefined>(undefined)

    const [userDoc, setUserDoc] = useState<any>(null)

    const [allLoadingDone, setAllLoadingDone] = useState<boolean>(false);
    const [homeLoadingDone, setHomeLoadingDone] = useState<boolean>(false);
    const [acadLoadingDone, setAcadLoadingDone] = useState<boolean>(false);
    const [bulLoadingDone, setBulLoadingDone] = useState<boolean>(false);

    const [nowSeconds, setNowSeconds] = useState<number>(0);

    const [lastAll, setLastAll] = useState<any>(null);
    const [lastHome, setLastHome] = useState<any>(null);
    const [lastAcad, setLastAcad] = useState<any>(null);
    const [lastBul, setLastBul] = useState<any>(null);

    const [allSort, setAllSort] = useState<string>('timestamp.seconds')
    const [homeSort, setHomeSort] = useState<string>('timestamp.seconds')
    const [acadSort, setAcadSort] = useState<string>('timestamp.seconds')
    const [bulSort, setBulSort] = useState<string>('timestamp.seconds')

    const [upvoted, setUpvoted] = useState<string[]>([])
    const [downvoted, setDownvoted] = useState<string[]>([])
    const [changed, setChanged] = useState<boolean>(false);

    const getChannels = async () => {
        try {
            const user = await firebase.db.collection('users').doc(session.auth?.uid).get()
            console.log('user = ', user.data())
            const userData = user.data()
            setUserDoc(userData)
            if (userData?.upvoted) {
                setUpvoted(userData?.upvoted)
            }
            if (userData?.downvoted) {
                setDownvoted(userData?.downvoted)
            }
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

    const getPosts = async (sort: string, timeframe: string, category: string, lastCategory: any, setLastCategory: any, setCategoryFeed: any, setLoading: any, subjects: string[] | undefined, update: boolean) => {
        console.log('lastCategory START = ', lastCategory)
        try {
            var docList: any[] = []
            var query = firebase.db.collection('posts').orderBy('timestamp.seconds', 'desc')
            if (timeframe === 'today') {
                query = query.where('timestamp.seconds', '>=', nowSeconds - 86400)
            } if (timeframe === 'week') {
                query = query.where('timestamp.seconds', '>=', (nowSeconds - 604800))
            } if (timeframe === 'month') {
                query = query.where('timestamp.seconds', '>=', (nowSeconds - 2629745))
            } if (timeframe === 'year') {
                query = query.where('timestamp.seconds', '>=', (nowSeconds - 31556926))
            }

            let posts = null;
            console.log('subjects =', subjects)
            if (category === 'all') {
                if (lastCategory) {
                    console.log('lastCategory = ', lastCategory)
                    var lastTime;
                    if (sort = 'upvotes') {
                        lastTime = lastCategory.data().upvotes
                    } else {
                        lastTime = lastCategory.data().timestamp.seconds
                    }

                    console.log('lastTime = ', lastTime)
                    posts = await query.startAfter(lastTime).limit(10).get()
                } else {
                    posts = await query.limit(10).get()
                    console.log('tHIS POSTS = ', posts.size)
                }


            } else {
                if (subjects == undefined || subjects?.length == 0) {
                    posts = null
                    setLoading(true)
                    return
                } else {
                    if (lastCategory) {
                        console.log('lastCategory 2 = ', lastCategory)
                        const lastTime = lastCategory.data().timestamp.seconds
                        posts = await query.startAfter(lastTime).where('channels', 'array-contains-any', subjects).limit(10).get()
                    } else {
                        posts = await query.where('channels', 'array-contains-any', subjects).limit(10).get()
                    }

                }
            }


            if (posts?.empty || posts == null) {
                console.log('No matching documents')
                setLoading(true)
                return;
            } else {
                console.log('posts = ', posts)
                console.log('this is triggered')
                const lastPost = posts.docs[posts.docs.length - 1]
                setLastCategory(lastPost)
            }

            posts.forEach(doc => {
                docList = [...docList, { id: doc.id, data: doc.data() }];
            });


            for (let i = 0; i < docList.length; i++) {
                const doc = docList[i]
                const numComments = await firebase.db.collection('comments').where('thread', '==', doc.id).get()
                docList[i] = { id: doc.id, data: doc.data, numComments: numComments.size }
            }

            if (category === 'all') {
                if (update) {
                    setAllFeed([...docList])
                } else {
                    setAllFeed([...allFeed, ...docList])
                }
                setAllLoadingDone(true)
            }
            if (category === 'home') {
                if (update) {
                    setHomeFeed([...docList])
                } else {
                    setHomeFeed([...allFeed, ...docList])
                }
                setHomeLoadingDone(true)
            }
            if (category === 'academic') {
                if (update) {
                    setAcademic([...docList])
                } else {
                    setAcademic([...allFeed, ...docList])
                }
                setAcadLoadingDone(true)
            }
            if (category === 'bulletin') {
                if (update) {
                    setBulletin([...docList])
                } else {
                    setBulletin([...allFeed, ...docList])
                }
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

        setChannels(subjects)

        getPosts('timestamp.seconds', 'timestamp.seconds', 'all', lastAll, setLastAll, setAllFeed, setAllLoadingDone, subjects, false)
        getPosts('timestamp.seconds', 'timestamp.seconds', 'home', lastHome, setLastHome, setHomeFeed, setHomeLoadingDone, subjects, false)
        getPosts('timestamp.seconds', 'timestamp.seconds', 'academic', lastAcad, setLastAcad, setAcademic, setAcadLoadingDone, subjects, false)
        getPosts('timestamp.seconds', 'timestamp.seconds', 'bulletin', lastBul, setLastBul, setBulletin, setBulLoadingDone, subjects, false)

        console.log('subjects = ', subjects)
    }

    useEffect(() => {
        var now = new Date();
        var seconds = ((now.getTime()) * .001) >> 0;
        setNowSeconds(seconds);

        console.log(seconds)
        //retrieves the most recent 10 posts



        loadPosts()
    }, [session, firebase])


    //a feed object
    const feedCard = (object: { id: string; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string; channels: Array<string>; authorName: string; upvotes: number }; numComments: number }) => {

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

        const handleVote = (upvoteTrue: boolean) => {
            var upvoteList: string[] = []
            var downvoteList: string[] = []
            var upvoteIndex = -1
            var downvoteIndex = -1
            console.log('userDoc = ', userDoc)
            if (userDoc.upvoted) {
                upvoteList = upvoted
                upvoteIndex = upvoteList.indexOf(object.id)
            }
            if (userDoc.downvoted) {
                downvoteList = downvoted
                downvoteIndex = downvoteList.indexOf(object.id)
            }

            console.log('upvoteIndex = ', upvoteIndex)

            console.log('upvoteList = ', upvoteList)

            console.log('downvoteIndex = ', downvoteIndex)

            console.log('downvoteList = ', downvoteList)

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

                firebase.db.collection('posts').doc(object.id).update({ upvotes: upvotes })
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
                firebase.db.collection('posts').doc(object.id).update({ upvotes: upvotes })
                object.data.upvotes = upvotes;
            }


            if (upvoteList) {
                setUpvoted(upvoteList)
            }
            if (downvoteList) {
                setDownvoted(downvoteList)
            }
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
                            <Button size="sm" active={upvoted.includes(object.id)} variant="outline-dark" onClick={() => {
                                handleVote(true)
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
                            <Button size="sm" active={downvoted.includes(object.id)} variant="outline-dark" onClick={() => {
                                handleVote(false)
                                setChanged(!changed)
                            }}>▼</Button>
                        </Col>
                    </Row>

                    <Card.Text className={styles.fontLess} style={{ paddingTop: 10 }}>
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
    const feedView = (feedList: { id: string; data: { title: string; desc: string; timestamp: { seconds: number; nanoseconds: number }; author: string; channels: string[]; authorName: string; upvotes: number }; numComments: number }[]) => {
        const feedItems = feedList.map((object: { id: string; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string; channels: Array<string>; authorName: string; upvotes: number }; numComments: number }) => <div key={object.id} style={{ paddingTop: 15 }}>{feedCard(object)}</div>
        )
        return feedItems
    }

    const sortButton = (category: string, feedSort: string, setLastFeed: any, setCategoryFeed: any, setFeedLoading: any, setFeedSort: any) => {
        const handleSort = async (sortType: string, timeframe: string) => {
            setLastFeed(null)
            setCategoryFeed([])
            setFeedLoading(false)
            await getPosts(sortType, timeframe, category, null, setLastFeed, setCategoryFeed, setFeedLoading, channels, true)
            await setFeedSort(timeframe)
        }

        return (
            <DropdownButton id="sort" title='Sort by' variant='light' style={{ paddingTop: 15 }}>
                <Dropdown.Item active={feedSort == 'timestamp.seconds'}
                    onClick={async () => {
                        if (feedSort == 'timestamp.seconds') {
                            return
                        } else {
                            handleSort('timestamp.seconds', 'timestamp.seconds')
                        }
                    }}
                >
                    Most Recent
                                        </Dropdown.Item>
                <Dropdown.Item active={feedSort == 'today'}
                    onClick={async () => {
                        if (feedSort == 'today') {
                            return
                        } else {
                            handleSort('upvotes', 'today')
                        }
                    }}
                >
                    Top of Today
                                        </Dropdown.Item>
                <Dropdown.Item active={feedSort == 'week'}
                    onClick={() => {
                        if (feedSort == 'week') {
                            return
                        } else {
                            handleSort('upvotes', 'week')
                        }
                    }}
                >
                    Top of This Week
                                        </Dropdown.Item>
                <Dropdown.Item active={feedSort == 'month'}
                    onClick={() => {
                        if (feedSort == 'month') {
                            return
                        } else {
                            handleSort('upvotes', 'month')
                        }
                    }}
                >
                    Top of This Month
                                        </Dropdown.Item>
                <Dropdown.Item active={feedSort == 'year'}
                    onClick={() => {
                        if (feedSort == 'year') {
                            return
                        } else {
                            handleSort('upvotes', 'year')
                        }
                    }}
                >
                    Top of This Year
                                        </Dropdown.Item>
                <Dropdown.Item active={feedSort == 'allTime'}
                    onClick={() => {
                        if (feedSort == 'allTime') {
                            return
                        } else {
                            handleSort('upvotes', 'allTime')
                        }
                    }}
                >
                    Top of All Time
                                        </Dropdown.Item>
            </DropdownButton>
        )
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
                        {sortButton('all', allSort, setLastAll, setAllFeed, setAllLoadingDone, setAllSort)}
                        {

                            allFeed[0] ?
                                <div>
                                    {feedView(allFeed)}
                                    <Button variant='light' onClick={() => { getPosts('timestamp.seconds', 'timestamp.seconds', 'all', lastAll, setLastAll, setAllFeed, setAllLoadingDone, [], false) }}>Load more</Button>
                                </div>

                                :
                                allLoadingDone ?
                                    <Card style={{ marginTop: 15 }}>
                                        <Card.Body>
                                            <Card.Text>No new posts.</Card.Text>
                                        </Card.Body>
                                    </Card>
                                    :
                                    feedLoadingView()
                        }

                    </Tab>
                    <Tab eventKey="Home" title="Home">
                        {sortButton('home', homeSort, setLastHome, setHomeFeed, setHomeLoadingDone, setHomeSort)}
                        {
                            homeFeed[0] ?
                                <div>
                                    {feedView(homeFeed)}
                                    <Button variant='light' onClick={() => { getPosts('timestamp.seconds', 'timestamp.seconds', 'home', lastHome, setLastHome, setHomeFeed, setHomeLoadingDone, channels, false) }}>Load more</Button>
                                </div>

                                :
                                homeLoadingDone ?
                                    session.auth ?
                                        <Card style={{ marginTop: 15 }}>
                                            <Card.Body>
                                                <Card.Text>No new posts. Subscribe to more channels in your Profile page!</Card.Text>
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
                        {sortButton('academic', acadSort, setLastAcad, setAcademic, setAcadLoadingDone, setAcadSort)}
                        {
                            academic[0] ?
                                <div>
                                    {feedView(academic)}
                                    <Button variant='light' onClick={() => { getPosts('timestamp.seconds', 'timestamp.seconds', 'academic', lastAcad, setLastAcad, setAcademic, setAcadLoadingDone, channels, false) }}>Load more</Button>
                                </div>

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
                        {sortButton('bulletin', bulSort, setLastBul, setBulletin, setBulLoadingDone, setBulSort)}
                        {
                            bulletin[0] ?
                                <div>
                                    {feedView(bulletin)}
                                    <Button variant='light' onClick={() => { getPosts('timestamp.seconds', 'timestamp.seconds', 'bulletin', lastBul, setLastBul, setBulletin, setBulLoadingDone, channels, false) }}>Load more</Button>
                                </div>

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
