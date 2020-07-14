import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { useFirebase, Firebase } from '../Firebase'
import { functions, auth, firestore } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card, Form } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Question.module.css'

const QuestionPage: React.FC = (props) => {
    const firebase = useFirebase()
    const session = useSession()

    const { postid } = useParams()

    const [self, setSelf] = useState<any>(null);
    const [post, setPost] = useState<any>(null);

    const [answer, setAnswer] = useState<string>("")

    useEffect(() => {
        if (session.auth) {
            const getSelf = async () => {
                const selfDoc = await (await firestore().collection('users').doc(session.auth?.uid).get()).data()
                setSelf(selfDoc)
            }
            getSelf();
        }


        const getPost = async () => {
            const postDoc = await (await firestore().collection('posts').doc(postid).get()).data()
            console.log('postDoc = ', postDoc)
            setPost(postDoc)
        }

        getPost();
    }, [session, firebase])


    const handleAnswerChange = (event: any) => {
        setAnswer(event.target.value)
    }

    const handleSubmit = async (event: any) => {
        event.preventDefault()
        console.log(answer)
        const newPost = { answer: answer, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid, authorName: self.username }
    }


    return (
        <div>
            <Navbar bg="light" variant="light">
                <Navbar.Brand href="/">
                    {' '}
                            ioyou
                    </Navbar.Brand>
                <Nav className="ml-auto">
                    <Button variant="light" onClick={async () => {
                        const user = await firebase.db.collection('users').doc(session?.auth?.uid).get()
                        const username = user?.data()?.username
                        window.location.href = `/user/${username}`
                    }} style={{ marginRight: 10 }}>
                        Profile
                            </Button>
                    <Button variant="outline-dark" onClick={() => { firebase.doSignOut() }}>
                        sign out
                    </Button>
                </Nav>
            </Navbar>
            <Container className={styles.paddingTop}>
                <Card style={{ marginBottom: 30 }}>
                    <Card.Body>
                        <Card.Title>{post?.title}</Card.Title>
                        <Card.Text>{post?.desc}</Card.Text>
                        <Card.Text className={styles.fontLess}>Posted by {`@${post?.authorName}`} at {post?.timestamp.seconds}</Card.Text>
                    </Card.Body>
                </Card>

                <Form onSubmit={handleSubmit}>

                    <Form.Group controlId="description">
                        <Form.Label>Answer</Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="" onChange={handleAnswerChange} />
                    </Form.Group>

                    <Button variant="primary" type="submit" style={{ marginTop: 15 }}>
                        Comment
                        </Button>
                </Form>
                <hr></hr>
                <h3 style={{ paddingTop: 50, paddingLeft: 22, paddingBottom: 15 }}>Comments</h3>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title>@guy</Card.Title>
                        <Card.Text className={styles.fontLess}> This is my answer</Card.Text>
                    </Card.Body>
                </Card>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title>@guy</Card.Title>
                        <Card.Text className={styles.fontLess}> This is my answer</Card.Text>
                    </Card.Body>
                </Card>
                <Card style={{ marginBottom: 20 }}>
                    <Card.Body>
                        <Card.Title>@guy</Card.Title>
                        <Card.Text className={styles.fontLess}> This is my answer</Card.Text>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    )
}


export { QuestionPage }
