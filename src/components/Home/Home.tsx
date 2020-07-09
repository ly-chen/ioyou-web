import React, { useState, useCallback, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
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
        const getPosts = async () => {
            try {
                var docList: any[] = []
                const posts = await firebase.db.collection('posts').orderBy('timestamp').limit(10).get()
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

    const feedCard = (object: { id: string | number | undefined; data: { title: string; desc: string; timestamp: { seconds: number, nanoseconds: number }; author: string } }) => {
        return (
            <a href={`/question/${object.id}`}>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title>{object.data.title}</Card.Title>
                        <Card.Text className={styles.fontLess}> {object.data.desc}</Card.Text>
                    </Card.Body>
                </Card>
            </a>
        )
    }

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
                            <Button href="/post" style={{ marginRight: 10 }}>Create Post</Button>
                            <Button variant="outline-dark" onClick={() => { firebase.doSignOut() }}>
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
                        <h1 style={{ paddingLeft: 22 }}>Feed</h1>
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
