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
    const [comments, setComments] = useState<any>(null)

    const [loadingDone, setLoadingDone] = useState<boolean>(false);
    const [commentsDone, setCommentsDone] = useState<boolean>(false);

    const [handling, setHandling] = useState<boolean>(true);

    const getComments = async () => {
        try {
            var docList: any[] = []
            const commentsList = await firebase.db.collection('comments').where('parent', '==', postid).get()


            if (commentsList.empty || commentsList == null) {
                console.log('No matching documents')
                setCommentsDone(true)
                return;
            }
            commentsList.forEach(doc => {
                docList = [...docList, { id: doc.id, data: doc.data() }];
            });

            setComments(docList)
            console.log('docList = ', docList)
            setCommentsDone(true)
        } catch (e) {
            console.log(e)
            setCommentsDone(true)
        }
    }

    useEffect(() => {
        if (session.auth) {
            const getSelf = async () => {
                const selfDoc = await (await firestore().collection('users').doc(session.auth?.uid).get()).data()
                setSelf(selfDoc)
            }
            getSelf();
        }


        const getPost = async () => {
            try {
                const postDoc = await (await firestore().collection('posts').doc(postid).get()).data()
                console.log('postDoc = ', postDoc)

                setPost(postDoc)
                getComments()
                setLoadingDone(true)
            } catch (e) {
                console.log(e)
                setLoadingDone(true)
            }

        }

        getPost();
    }, [session, firebase])


    const handleAnswerChange = (event: any) => {
        setAnswer(event.target.value)
    }

    const handleSubmit = async (event: any) => {
        event.preventDefault()
        setHandling(true);
        console.log(answer)
        const newComment = { comment: answer, parent: postid, thread: postid, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid, authorName: self.username }
        await functions().httpsCallable('createComment')(newComment).then(() => {
            getComments()
            setHandling(false);
        })
    }

    //a feed object
    const feedCard = (object: { id: string | number | undefined; data: { comment: string; timestamp: { seconds: number, nanoseconds: number }; author: string; authorName: string; parent: string; thread: string } }) => {

        return (

            <Card style={{ marginBottom: 20 }}>
                <Card.Body>
                    <Card.Title>{`@${object.data.authorName}`}</Card.Title>
                    <Card.Text className={styles.fontLess}> {object.data.comment}</Card.Text>
                    <Card.Text className={styles.fontLess}>{object.data.timestamp.seconds}</Card.Text>
                </Card.Body>
            </Card>

            //
        )
    }

    //list of feed objects
    const feedView = (feedList: { id: string | number | undefined; data: { comment: string; timestamp: { seconds: number; nanoseconds: number }; author: string; authorName: string; parent: string; thread: string } }[]) => {
        const feedItems = feedList.map((object: { id: string | number | undefined; data: { comment: string; timestamp: { seconds: number, nanoseconds: number }; author: string; authorName: string; parent: string; thread: string } }) => <div key={object.id} style={{ paddingTop: 15 }}>{feedCard(object)}</div>
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
                            <Button variant="outline-dark" onClick={() => {
                                window.location.reload()
                                firebase.doSignOut()
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
                        </div>}
                </Nav>
            </Navbar>
            {post ?
                <Container className={styles.paddingTop}>
                    <Card style={{ marginBottom: 30 }}>
                        <Card.Body>
                            <Card.Title>{post?.title}</Card.Title>
                            <Card.Text>{post?.desc}</Card.Text>
                            <Card.Text className={styles.fontLess}>Posted by {`@${post?.authorName}`} at {post?.timestamp.seconds}</Card.Text>
                        </Card.Body>
                    </Card>

                    {session.auth ?
                        <Form onSubmit={handleSubmit}>

                            <Form.Group controlId="description">
                                <Form.Label>Answer</Form.Label>
                                <Form.Control as="textarea" rows={3} placeholder="" onChange={handleAnswerChange} />
                            </Form.Group>

                            {handling ?
                                <Button variant="primary" style={{ marginTop: 15 }}>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                </Button>
                                :
                                <Button variant="primary" type="submit" style={{ marginTop: 15 }}>
                                    Comment
                                </Button>
                            }

                        </Form>
                        :
                        <div></div>
                    }


                    <hr></hr>



                    {comments
                        ?
                        <div>
                            <h3 style={{ paddingTop: 50, paddingLeft: 22, paddingBottom: 15 }}>{comments.length} comments</h3>
                            {feedView(comments)}
                        </div>
                        :
                        commentsDone ?
                            <h3 style={{ paddingTop: 50, paddingLeft: 22, paddingBottom: 15 }}>0 comments</h3>
                            :
                            <Spinner animation="border" />
                    }
                </Container>
                :
                loadingDone ?
                    <Container className={styles.paddingTop}>
                        <h1>No post found.</h1>
                    </Container>
                    :
                    <Container className={styles.paddingTop}>
                        <Spinner animation="border" />
                    </Container>
            }

        </div>
    )
}


export { QuestionPage }
