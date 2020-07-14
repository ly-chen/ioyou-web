import React, { useState, useCallback, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { functions, auth, firestore } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Home.module.css'

const HomePage: React.FC = () => {
    const firebase = useFirebase()
    const session = useSession()

    const [feedList, setFeedList] = useState<any>(null)

    // Sample write to Firestore
    const accessFirestore = useCallback(async () => {
        if (session.auth?.uid) {
            try {
                await firebase.db.collection('profiles').doc(session.auth.uid).set({
                    key: 'value'
                })
            } catch (error) {
                console.log('Error writing Firestore', error)
            }
        }
    }, [session.auth, firebase])

    useEffect(() => {
        //retrieves the most recent 10 posts
        const getPosts = async () => {
            try {
                var docList: any[] = []
                const posts = await firebase.db.collection('posts').orderBy('timestamp.seconds',"desc").limit(10).get()
                if (posts.empty) {
                    console.log('No matching documents')
                    return;
                }
                posts.forEach(doc => {
                    console.log(doc.id, '=>', doc.data());
                    docList = [...docList, { id: doc.id, data: doc.data() }];
                    console.log('docList = ', docList)
                });
                setFeedList(docList)
            } catch (e) {
                console.log(e)
            }
        }

        getPosts();
    }, [session, firebase])
    

    //a feed object
    const feedCard = (object: { id: string | number | undefined; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string } }) => {
     
        const date = new Date((object.data.timestamp.seconds)*1000).toLocaleDateString();
        const time = new Date((object.data.timestamp.seconds)*1000).toLocaleTimeString();
        console.log('date = ', date)
        return (
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                    <a href={`/question/${object.id}`}>
                        <Card.Title>{object.data.title}</Card.Title>
                        </a>
                        <Card.Text className={styles.fontLess}> {object.data.desc}</Card.Text>
                        <Card.Text className={styles.fontLess}>{date}</Card.Text>
                        <Card.Text className={styles.fontLess}>{time}</Card.Text>
                    </Card.Body>
                </Card>
                
            //
        )
    }

    //loading animation while retrieving feed
    const feedLoadingView = () => {
        return (
            <div>

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
    const feedView = () => {
        const feedItems = feedList.map((object: { id: string | number | undefined; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string } }) => <div key={object.id}>{feedCard(object)}</div>
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
            <Container className={styles.paddingTop}>
                <Row>
                    <Col>
                        <h1 style={{ paddingLeft: 22, paddingBottom: 15 }}>Feed</h1>
                    </Col>
                    <Col>

                    </Col>
                </Row>
                {
                    feedList ?
                        feedView()
                        :
                        feedLoadingView()
                }
            </Container>
        </div>
    )
}

export { HomePage }
