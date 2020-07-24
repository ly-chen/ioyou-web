import React, { useState, useCallback, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { functions, auth, firestore } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card, Tabs, Tab, DropdownButton, Dropdown, Modal, InputGroup, Form } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Home.module.css'
import { NavBar } from '../../constants'

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

    const [reportMessage, setReportMessage] = useState<string>('')
    const [reportAuthorName, setReportAuthorName] = useState<string>('')
    const [reportID, setReportID] = useState<string>('')
    const [reportHandling, setReportHandling] = useState<boolean>(false)
    const [reportDone, setReportDone] = useState<boolean>(false);

    const [reportModalShow, setReportModalShow] = useState<boolean>(false)

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

    const getPosts = async (sort: string, category: string, categoryFeed: any[], lastCategory: any, setLastCategory: any, setCategoryFeed: any, setLoading: any, subjects: string[] | undefined, update: boolean) => {
        console.log('lastCategory START = ', lastCategory)
        try {
            var docList: any[] = []
            var query = firebase.db.collection('posts').orderBy(sort, 'desc')

            let posts = null;
            console.log('subjects =', subjects)
            if (category === 'all') {
                console.log('lastCategory')
                if (lastCategory) {
                    console.log('lastCategory = ', lastCategory)
                    const lastTime = sort == 'timestamp.seconds' ? lastCategory.data.timestamp.seconds : lastCategory.data.upvotes

                    console.log('lastTime = ', lastTime)
                    posts = await query.startAfter(lastTime).limit(10).get()
                } else {
                    posts = await query.limit(10).get()
                    console.log('tHIS POSTS = ', posts.size)
                }


            } else {
                if (category == 'academic') {
                    if (subjects == undefined || subjects?.length == 0) {
                        posts = null
                        setLoading(true)
                        return
                    }
                    query = query.where('bulletin', '==', false)
                }
                if (lastCategory) {
                    console.log('lastCategory 2 = ', lastCategory)
                    const lastTime = sort == 'timestamp.seconds' ? lastCategory.data.timestamp.seconds : lastCategory.data.upvotes
                    console.log('lastTime = ', lastTime)
                    if (category == 'bulletin') {
                        posts = await query.startAfter(lastTime).where('bulletin', '==', true).limit(10).get()
                    } else {
                        posts = await query.startAfter(lastTime).where('channels', 'array-contains-any', subjects).limit(10).get()
                    }
                } else {
                    if (category == 'bulletin') {
                        posts = await query.where('bulletin', '==', true).limit(10).get()
                    } else {
                        posts = await query.where('channels', 'array-contains-any', subjects).limit(10).get()
                    }
                }
            }


            if (posts?.empty || posts == null) {
                console.log('No matching documents')
                setLoading(true)
                return;
            }


            posts?.forEach(doc => {
                docList = [...docList, { id: doc.id, data: doc.data() }];
            });

            const lastPost = docList[docList.length - 1]
            setLastCategory(lastPost)

            for (let i = 0; i < docList.length; i++) {
                const doc = docList[i]
                const numComments = await firebase.db.collection('comments').where('thread', '==', doc.id).get()
                docList[i] = { id: doc.id, data: doc.data, numComments: numComments.size }
            }

            if (update) {
                setCategoryFeed([...docList])

            } else {
                setCategoryFeed([...categoryFeed, ...docList])
            }

            setLoading(true)


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

        getPosts('timestamp.seconds', 'all', allFeed, lastAll, setLastAll, setAllFeed, setAllLoadingDone, subjects, false)
        getPosts('timestamp.seconds', 'home', homeFeed, lastHome, setLastHome, setHomeFeed, setHomeLoadingDone, subjects, false)
        getPosts('timestamp.seconds', 'academic', academic, lastAcad, setLastAcad, setAcademic, setAcadLoadingDone, subjects, false)
        getPosts('timestamp.seconds', 'bulletin', bulletin, lastBul, setLastBul, setBulletin, setBulLoadingDone, subjects, false)

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

    const handleReportChange = (event: any) => {
        setReportMessage(event.target.value);
    }


    //a feed object
    const feedCard = (object: { id: string; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string; channels: Array<string>; authorName: string; upvotes: number; bounty: number; bulletin: boolean }; numComments: number }) => {

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

                    {object.data.bulletin ?
                        <div>
                            <a href={`/post/${object.id}`}>
                                <Card.Title>{object.data.title}</Card.Title>
                            </a>
                            <Card.Subtitle>{channelView()}</Card.Subtitle>
                        </div>
                        :
                        <Row>
                            <Col>
                                <a href={`/post/${object.id}`}>
                                    <Card.Title>{object.data.title}</Card.Title>
                                </a>
                                <Card.Subtitle>{channelView()}</Card.Subtitle>

                            </Col>
                            <Col xs={3} md={2} style={{ textAlign: 'center' }}>
                                <Card bg="light" >
                                    {object.data.bounty <= 0 ?
                                        <Card.Title style={{ paddingTop: 10 }}>Claimed</Card.Title>
                                        :
                                        <Card.Title style={{ paddingTop: 10 }}>{object.data.bounty} cr.</Card.Title>
                                    }

                                </Card>

                            </Col>
                        </Row>
                    }

                    <Card.Text className={styles.fontLess}> {object.data.desc}</Card.Text>


                    <Card.Text className={styles.fontLess} style={{ paddingTop: 10 }}>
                        <Button disabled={!session.auth} size="sm" active={upvoted.includes(object.id)} variant="outline-primary" onClick={() => {
                            handleVote(true)
                            setChanged(!changed)
                        }}>
                            ▲
                            </Button>
                        {' '}
                        &nbsp;
                        {object.data.upvotes ?
                            object.data.upvotes
                            :
                            0
                        }
                        {' '}
                        &nbsp;
                        <Button disabled={!session.auth} size="sm" active={downvoted.includes(object.id)} variant="outline-danger" onClick={() => {
                            handleVote(false)
                            setChanged(!changed)
                        }}>▼</Button>
                        {' '}
                        &nbsp;
                        {object.numComments == 1 ?
                            <a href={`/post/${object.id}`}>{object.numComments} comment</a>
                            :
                            <a href={`/post/${object.id}`}>{object.numComments} comments</a>
                        }

                        {' '} - posted by <a href={`/user/${object.data.authorName}`}>{`@${object.data.authorName}`}</a> - {message}
                        {' - '}
                        &nbsp;
                        <Button disabled={!session.auth} size="sm" variant='outline-danger' onClick={() => {
                            setReportAuthorName(object.data.authorName)
                            setReportID(object.id)
                            setReportModalShow(true)
                        }}>
                            ⚐
                        </Button>
                    </Card.Text>
                </Card.Body>
            </Card >
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
    const feedView = (feedList: { id: string; data: { title: string; desc: string; timestamp: { seconds: number; nanoseconds: number }; author: string; channels: string[]; authorName: string; upvotes: number; bounty: number; bulletin: boolean }; numComments: number }[]) => {
        const feedItems = feedList.map((object: { id: string; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string; channels: Array<string>; authorName: string; upvotes: number; bounty: number; bulletin: boolean }; numComments: number }) => <div key={object.id} style={{ paddingTop: 15 }}>{feedCard(object)}</div>
        )
        return feedItems
    }

    const sortButton = (category: string, categoryFeed: any[], feedSort: string, setLastFeed: any, setCategoryFeed: any, setFeedLoading: any, setFeedSort: any) => {
        const handleSort = async (sortType: string) => {
            setLastFeed(null)
            setCategoryFeed([])
            setFeedLoading(false)
            await getPosts(sortType, category, categoryFeed, null, setLastFeed, setCategoryFeed, setFeedLoading, channels, true)
            await setFeedSort(sortType)
        }

        return (
            <DropdownButton id="sort" title={feedSort == 'bounty' ? 'Highest Bounty' : 'timestamp.seconds' ? 'Most Recent' : 'Top Rated'} variant='light' style={{ paddingTop: 15 }}>
                <Dropdown.Item active={feedSort == 'timestamp.seconds'}
                    onClick={async () => {
                        if (feedSort == 'timestamp.seconds') {
                            return
                        } else {
                            handleSort('timestamp.seconds')
                        }
                    }}
                >
                    Most Recent
                                        </Dropdown.Item>

                <Dropdown.Item active={feedSort == 'bounty'}
                    onClick={async () => {
                        if (feedSort == 'bounty') {
                            return
                        } else {
                            handleSort('bounty')
                        }
                    }}
                >
                    Highest Bounty
                                        </Dropdown.Item>

                <Dropdown.Item active={feedSort == 'upvotes'}
                    onClick={() => {
                        if (feedSort == 'upvotes') {
                            return
                        } else {
                            handleSort('upvotes')
                        }
                    }}
                >
                    Top Rated
                                        </Dropdown.Item>
            </DropdownButton>
        )
    }

    return (
        <div>
            <NavBar />
            <Modal show={reportModalShow} onHide={() => {
                setReportModalShow(false)
                setReportDone(false)
                setReportMessage('')
            }}>
                <Modal.Header closeButton>
                    <Modal.Title>Report @{reportAuthorName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Let us know if this user is violating community agreements as outlined in our terms of service. Thanks!
                    </Modal.Body>
                <Modal.Footer>
                    <InputGroup>
                        <Form.Control as="textarea" placeholder="What's the reason for reporting this user?" rows={3} onChange={handleReportChange} value={reportMessage} />
                    </InputGroup>
                    {reportHandling ?
                        <Button disabled variant='danger'>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            />
                        </Button>
                        :
                        reportDone ?
                            <Button disabled variant='danger'>Thanks! You can close this window.</Button>

                            :
                            <Button variant='danger' onClick={async () => {
                                setReportHandling(true);
                                await functions().httpsCallable('createReport')({ post: reportID, reportMessage: reportMessage, submittedBy: session.auth?.uid, timestamp: firestore.Timestamp.now() }).then(() => {
                                    setReportHandling(false);
                                    setReportDone(true);
                                })
                            }}>Report
                        </Button>
                    }

                </Modal.Footer>
            </Modal>
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
                        {sortButton('all', allFeed, allSort, setLastAll, setAllFeed, setAllLoadingDone, setAllSort)}
                        {

                            allFeed[0] ?
                                <div>
                                    {feedView(allFeed)}
                                    {allLoadingDone ?
                                        <Button variant='light' onClick={() => {
                                            setAllLoadingDone(false)
                                            getPosts(allSort, 'all', allFeed, lastAll, setLastAll, setAllFeed, setAllLoadingDone, [], false)
                                        }}>Load more</Button>
                                        :
                                        <Button disabled variant="light">
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                            />
                                        </Button>
                                    }

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
                        {sortButton('home', homeFeed, homeSort, setLastHome, setHomeFeed, setHomeLoadingDone, setHomeSort)}
                        {
                            homeFeed[0] ?
                                <div>
                                    {feedView(homeFeed)}
                                    {homeLoadingDone ?
                                        <Button variant='light' onClick={() => {
                                            setHomeLoadingDone(false)
                                            getPosts(homeSort, 'home', homeFeed, lastHome, setLastHome, setHomeFeed, setHomeLoadingDone, channels, false)
                                        }}>Load more</Button>
                                        :
                                        <Button disabled variant='light'>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                            />
                                        </Button>}

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
                        {sortButton('academic', academic, acadSort, setLastAcad, setAcademic, setAcadLoadingDone, setAcadSort)}
                        {
                            academic[0] ?
                                <div>
                                    {feedView(academic)}
                                    {acadLoadingDone ?
                                        <Button variant='light' onClick={() => {
                                            setAcadLoadingDone(false)
                                            getPosts(acadSort, 'academic', academic, lastAcad, setLastAcad, setAcademic, setAcadLoadingDone, channels, false)
                                        }}>Load more</Button>
                                        :
                                        <Button disabled variant='light'>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                            />
                                        </Button>}

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
                        {sortButton('bulletin', bulletin, bulSort, setLastBul, setBulletin, setBulLoadingDone, setBulSort)}
                        {
                            bulletin[0] ?
                                <div>
                                    {feedView(bulletin)}
                                    {bulLoadingDone ?
                                        <Button variant='light' onClick={() => {
                                            setBulLoadingDone(false)
                                            getPosts(bulSort, 'bulletin', bulletin, lastBul, setLastBul, setBulletin, setBulLoadingDone, channels, false)
                                        }}>Load more</Button>
                                        :
                                        <Button disabled variant='light'>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                            />
                                        </Button>
                                    }

                                </div>

                                :
                                bulLoadingDone ?
                                    <Card style={{ marginTop: 15 }}>
                                        <Card.Body>
                                            <Card.Text>No new posts.</Card.Text>
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
