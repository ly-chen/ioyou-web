import React, { useState, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { functions, auth, firestore } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card, Form } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Question.module.css'

const QuestionPage: React.FC = () => {
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

    const [changed, setChanged] = useState<boolean>(false);

    const [upvoted, setUpvoted] = useState<string[]>([])
    const [downvoted, setDownvoted] = useState<string[]>([])

    const getComments = async (id: string) => {
        try {
            var docList: any[] = []
            const commentsList = await firebase.db.collection('comments').where('parent', '==', id).orderBy('upvotes', 'desc').limit(10).get()

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

    const handleVote = (upvoteTrue: boolean, object: any) => {
        var collect = 'comments'
        if (object == post) {
            const newObject = { data: post, id: postid }
            object = newObject
            collect = 'posts'
        }
        var upvoteList: string[] = []
        var downvoteList: string[] = []
        var upvoteIndex = -1
        var downvoteIndex = -1
        console.log('userDoc = ', self)
        if (self.upvoted) {
            upvoteList = upvoted
            upvoteIndex = upvoteList.indexOf(object.id)
        }
        if (self.downvoted) {
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

            firebase.db.collection(collect).doc(object.id).update({ upvotes: upvotes })
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
            firebase.db.collection(collect).doc(object.id).update({ upvotes: upvotes })
            object.data.upvotes = upvotes;
        }


        if (upvoteList) {
            setUpvoted(upvoteList)
        }
        if (downvoteList) {
            setDownvoted(downvoteList)
        }
    }

    useEffect(() => {

        const setAllComments = async () => {
            const allComments = await firebase.db.collection('comments').where('thread', '==', postid).get()
            setNumComments(allComments.size)
        }
    })

        setAllComments()

        var now = new Date();
        var seconds = ((now.getTime()) * .001) >> 0;
        setNowSeconds(seconds);

        if (session.auth) {
            const getSelf = async () => {
                const selfDoc = await (await firestore().collection('users').doc(session.auth?.uid).get()).data()
                setSelf(selfDoc)
                if (selfDoc?.upvoted) {
                    setUpvoted(selfDoc?.upvoted)
                }
                if (selfDoc?.downvoted) {
                    setDownvoted(selfDoc?.downvoted)
                }

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
        const newReply = { comment: replyText, parent: reply, thread: postid, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid, authorName: self.username, upvotes: 0 }
        await functions().httpsCallable('createComment')(newReply).then(async () => {
            setComments(await getComments(postid))
            setNumComments(numComments + 1)
            setCommentsDone(true);
            setReplyHandling(false);
            setReply('');
        })
    }

    const handleSubmit = async (event: any) => {
        event.preventDefault()
        setHandling(true);
        console.log(answer)
        const newComment = { comment: answer, parent: postid, thread: postid, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid, authorName: self.username, upvotes: 0 }
        await functions().httpsCallable('createComment')(newComment).then(async () => {
            setComments(await getComments(postid))
            setNumComments(numComments + 1)
            setCommentsDone(true);
            setHandling(false);
            setActiveAnswer(false);
        })
    }

    //a feed object
    const feedCard = (object: { id: string; data: { comment: string; timestamp: { seconds: number, nanoseconds: number }; author: string; authorName: string; parent: string; thread: string; upvotes: number }; replies: any[] }) => {
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

            <div className={styles.borderLeft} style={{ marginBottom: 10, paddingLeft: 10, paddingTop: 10 }}>

                <p style={{ fontSize: 20 }}>{`@${object.data.authorName}`}</p>
                <p className={styles.fontLess}> {object.data.comment}</p>


                <p className={styles.fontLess}>
                    <Button disabled={!session.auth} active={upvoted.includes(object.id)} size="sm" variant="outline-dark" onClick={() => {
                        handleVote(true, object)
                        setChanged(!changed)
                    }}>
                        ▲
                    </Button>
                    {' '}
                    &nbsp;
                    {object?.data?.upvotes ?
                        object.data.upvotes
                        :
                        0
                    }
                    {' '}
                    &nbsp;
                    <Button disabled={!session.auth} active={downvoted.includes(object.id)} size="sm" variant="outline-dark" onClick={() => {
                        handleVote(false, object)
                        setChanged(!changed)
                    }}>▼</Button>
                    {' - '}
                    <Button variant="light" size="sm" onClick={() => { setReply(object.id) }}>Reply</Button>
                    {' '} - {message}
                </p>



                {reply == object.id ?
                    <Card>
                        <Card.Body>
                            <Form onSubmit={handleReplySubmit}>

                                <Form.Group controlId="description">
                                    <Form.Control required as="textarea" rows={3} placeholder={`Replying to @${object.data.authorName}...`} onChange={handleReplyChange} />
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

            </div>

            //
        )
    }

    //list of feed objects
    const feedView = (feedList: { id: string; data: { comment: string; timestamp: { seconds: number; nanoseconds: number }; author: string; authorName: string; parent: string; thread: string; upvotes: number }; replies: any[] }[]) => {
        const feedItems = feedList.map((object: { id: string; data: { comment: string; timestamp: { seconds: number, nanoseconds: number }; author: string; authorName: string; parent: string; thread: string; upvotes: number }; replies: any[] }) => <div key={object.id} style={{ paddingTop: 15 }}>{feedCard(object)}</div>
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
                            <Button variant="outline-dark" onClick={() => {
                                window.location.reload()
                                firebase.doSignOut()
                            }}>
                                Sign Out
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
                            <Row>
                                <Col>
                                    <Card.Title>{post?.title}</Card.Title>
                                    <Card.Subtitle>{channelView(post)}</Card.Subtitle>
                                    <Card.Text>{post?.desc}</Card.Text>
                                </Col>
                                <Col xs={3} sm={2} style={{ textAlign: 'center' }}>
                                    <Button disabled={!session.auth} active={upvoted.includes(postid)} size="sm" variant="outline-primary" onClick={() => {
                                        handleVote(true, post)
                                        setChanged(!changed)
                                    }}>
                                        ▲
                                    </Button>
                                    <p>{post?.upvotes ?
                                        post?.upvotes
                                        :
                                        0
                                    }
                                    </p>
                                    <Button disabled={!session.auth} active={downvoted.includes(postid)} size="sm" variant="outline-danger" onClick={() => {
                                        handleVote(false, post)
                                        setChanged(!changed)
                                    }}>▼</Button>
                                </Col>
                            </Row>


                            <Card.Text className={styles.fontLess} style={{ paddingTop: 10 }}>Posted by <a href={`/user/${post?.authorName}`}>{`@${post?.authorName}`}</a> {timeMessage}</Card.Text>
                        </Card.Body>
                    </Card>

                    {session.auth ?
                        activeAnswer ?

                            <Form onSubmit={handleSubmit}>

                                <Form.Group controlId="description">
                                    <Form.Label>Answer</Form.Label>
                                    <Form.Control required as="textarea" rows={3} placeholder="" onChange={handleAnswerChange} />
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



                    {comments ?
                        <div>
                            {numComments == 1 ?
                                <h3 style={{ paddingTop: 30, paddingLeft: 22, paddingBottom: 15 }}>{numComments} comment</h3>
                                :
                                <h3 style={{ paddingTop: 30, paddingLeft: 22, paddingBottom: 15 }}>{numComments} comments</h3>
                            }

                            {feedView(comments)}
                        </div>
                        :
                        commentsDone ?
                            <div>
                                <h3 style={{ paddingTop: 30, paddingLeft: 22, paddingBottom: 15 }}>{numComments} comments</h3>
                            </div>
                            :
                            <Spinner style={{ marginTop: 30, marginLeft: 30 }} animation="border" />
                    }

                </Container>
                :
                loadingDone ?
                    <Container className={styles.paddingTop}>
                        <h1>No post found.</h1>
                    </Container>
                    :
                    <Container className={styles.paddingTop}>
                        <Spinner style={{ marginTop: 30, marginLeft: 30 }} animation="border" />
                    </Container>
            }

        </div>
    )
}


export { QuestionPage }
