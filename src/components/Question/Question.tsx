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
    const [comments, setComments] = useState<any[] | undefined>(undefined)
    const [numComments, setNumComments] = useState<number>(0);

    const [activeAnswer, setActiveAnswer] = useState<boolean>(false);

    const [loadingDone, setLoadingDone] = useState<boolean>(false);
    const [commentsDone, setCommentsDone] = useState<boolean>(false);

    const [handling, setHandling] = useState<boolean>(false);

    const [nowSeconds, setNowSeconds] = useState<number>(0);

    const [timeMessage, setTimeMessage] = useState<string>('')

    const [reply, setReply] = useState<string>('')
    const [replyText, setReplyText] = useState<string>('')
    const [replyHandling, setReplyHandling] = useState<boolean>(false);

    const getComments = async (id: string) => {
        try {
            var docList: any[] = []
            const commentsList = await firebase.db.collection('comments').where('parent', '==', id).limit(10).get()

            console.log('commentsList = ', commentsList)
            if (commentsList.empty || commentsList == null) {
                console.log('No matching documents')
                setCommentsDone(true)
                return;
            }

            commentsList.forEach(doc => {
                docList = [...docList, { id: doc.id, data: doc.data() }];
            });

            for (let i = 0; i < docList.length; i++) {
                const doc = docList[i]
                const replies = await getComments(doc.id)
                docList[i] = { id: doc.id, data: doc.data, replies: replies }
            }

            return (docList)

        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        const setAllComments = async () => {
            const allComments = await firebase.db.collection('comments').where('thread', '==', postid).get()
            setNumComments(allComments.size)
        }

        setAllComments()

        var now = new Date();
        var seconds = ((now.getTime()) * .001) >> 0;
        setNowSeconds(seconds);

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

                if (postDoc) {
                    var time = seconds - postDoc?.timestamp.seconds;
                    console.log('time = ', time)
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

                    setTimeMessage(message)
                }

                setPost(postDoc)
                const commentsTest = await getComments(postid);
                console.log(commentsTest)
                setComments(commentsTest)
                setCommentsDone(true);
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

    const handleReplyChange = (event: any) => {
        setReplyText(event.target.value)
    }

    const handleReplySubmit = async (event: any) => {
        event.preventDefault()
        setReplyHandling(true);
        console.log(replyText)
        const newReply = { comment: replyText, parent: reply, thread: postid, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid, authorName: self.username }
        await functions().httpsCallable('createComment')(newReply).then(async () => {
            setComments(await getComments(postid))
            setCommentsDone(true);
            setReplyHandling(false);
            setReply('');
        })
    }

    const handleSubmit = async (event: any) => {
        event.preventDefault()
        setHandling(true);
        console.log(answer)
        const newComment = { comment: answer, parent: postid, thread: postid, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid, authorName: self.username }
        await functions().httpsCallable('createComment')(newComment).then(async () => {
            setComments(await getComments(postid))
            setCommentsDone(true);
            setHandling(false);
            setActiveAnswer(false);
        })
    }

    //a feed object
    const feedCard = (object: { id: string; data: { comment: string; timestamp: { seconds: number, nanoseconds: number }; author: string; authorName: string; parent: string; thread: string }; replies: any[] }) => {
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


        return (

            <Card style={{ marginBottom: 20 }}>
                <Card.Body>
                    <Card.Title>{`@${object.data.authorName}`}</Card.Title>
                    <Card.Text className={styles.fontLess}> {object.data.comment}</Card.Text>
                    <Card.Text className={styles.fontLess}>
                        <Button variant="light" size="sm" onClick={() => { setReply(object.id) }}>Reply</Button>
                        {' '} - {message}
                    </Card.Text>
                    {reply == object.id ?
                        <Card>
                            <Card.Body>
                                <Form onSubmit={handleReplySubmit}>

                                    <Form.Group controlId="description">
                                        <Form.Control as="textarea" rows={3} placeholder={`Replying to @${object.data.authorName}...`} onChange={handleReplyChange} />
                                    </Form.Group>

                                    {replyHandling ?
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
                                            Reply
                                        </Button>
                                    }

                                </Form>
                            </Card.Body>
                        </Card>
                        :
                        <div></div>
                    }
                    {object.replies && object.replies.length > 0 ?
                        feedView(object.replies)
                        :
                        <div></div>}
                </Card.Body>
            </Card>

            //
        )
    }

    //list of feed objects
    const feedView = (feedList: { id: string; data: { comment: string; timestamp: { seconds: number; nanoseconds: number }; author: string; authorName: string; parent: string; thread: string }; replies: any[] }[]) => {
        const feedItems = feedList.map((object: { id: string; data: { comment: string; timestamp: { seconds: number, nanoseconds: number }; author: string; authorName: string; parent: string; thread: string }; replies: any[] }) => <div key={object.id} style={{ paddingTop: 15 }}>{feedCard(object)}</div>
        )
        return feedItems
    }

    const channelView = (post: any) => {
        const subjectObjects = post.channels?.map((d: string) => <p key={d}>{(post.channels.indexOf(d) == 0) ? `#${d}` : `, #${d}`}</p>)
        return (
            <div>
                <Row style={{ marginLeft: 1 }}>{subjectObjects}</Row>

            </div>
        )
    }

    //console.log("Object.values(item) = ", Object.values(comments))

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
                            <Card.Subtitle>{channelView(post)}</Card.Subtitle>
                            <Card.Text>{post?.desc}</Card.Text>
                            <Card.Text className={styles.fontLess}>Posted by <a href={`/user/${post?.authorName}`}>{`@${post?.authorName}`}</a> {timeMessage}</Card.Text>
                        </Card.Body>
                    </Card>

                    {session.auth ?
                        activeAnswer ?

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
                            <Button variant="primary" onClick={() => { setActiveAnswer(true) }}>Comment</Button>
                        :
                        <div></div>
                    }


                    <hr></hr>



                    {commentsDone
                        ?
                        <div>
                            {numComments == 1 ?
                                <h3 style={{ paddingTop: 50, paddingLeft: 22, paddingBottom: 15 }}>{numComments} comment</h3>
                                :
                                <h3 style={{ paddingTop: 50, paddingLeft: 22, paddingBottom: 15 }}>{numComments} comments</h3>
                            }

                            {comments ?
                                feedView(comments)
                                :
                                <Spinner animation="border" />}
                        </div>
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
