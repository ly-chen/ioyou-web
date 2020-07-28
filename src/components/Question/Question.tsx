import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { useFirebase, Firebase } from '../Firebase'
import { functions, auth, firestore } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card, Form, Modal, InputGroup, FormControl } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Question.module.css'
import { NavBar } from '../../constants'

const QuestionPage: React.FC = (props) => {
    const firebase = useFirebase()
    const session = useSession()

    const { postid } = useParams()

    const [self, setSelf] = useState<any>(null);
    const [post, setPost] = useState<any>(null);
    const [postSelf, setPostSelf] = useState<boolean>(false);

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

    const [awardModalShow, setAwardModalShow] = useState<boolean>(false)
    const [award, setAward] = useState<number>(0)
    const [awardCheck, setAwardCheck] = useState<boolean>(false)
    const [awardHandling, setAwardHandling] = useState<boolean>(false)
    const [err, setErr] = useState<string>('')

    const [reportMessage, setReportMessage] = useState<string>('')
    const [reportAuthorName, setReportAuthorName] = useState<string>('')
    const [reportID, setReportID] = useState<string>('')
    const [reportHandling, setReportHandling] = useState<boolean>(false)
    const [reportDone, setReportDone] = useState<boolean>(false);

    const [reportModalShow, setReportModalShow] = useState<boolean>(false)

    const [deleteModalShow, setDeleteModalShow] = useState<boolean>(false)

    const [commentAuthorName, setCommentAuthorName] = useState<string>('')
    const [commentAuthor, setCommentAuthor] = useState<string>('')
    const [commentID, setCommentID] = useState<string>('')

    const [deleteCollection, setDeleteCollection] = useState<string>('')
    const [deleteID, setDeleteID] = useState<string>('')
    const [numReplies, setNumReplies] = useState<number>(0)
    const [deleteSelected, setDeleteSelected] = useState<number>(0)
    const [deleteHandling, setDeleteHandling] = useState<boolean>(false)

    const [editCollection, setEditCollection] = useState<string>('')
    const [editID, setEditID] = useState<string>('')
    const [fullEdit, setFullEdit] = useState<boolean>(false);
    const [editText, setEditText] = useState<string>('')
    const [readOnlyText, setReadOnlyText] = useState<string>('')
    const [editHandling, setEditHandling] = useState<boolean>(false);
    const [editModalShow, setEditModalShow] = useState<boolean>(false);

    const [editTitle, setEditTitle] = useState<string>('')
    const [editBounty, setEditBounty] = useState<number>(0)
    const [editBountyCheck, setEditBountyCheck] = useState<boolean>(true);

    const [bountyErr, setBountyErr] = useState<string>('')
    const [titleErr, setTitleErr] = useState<string>('')

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

    const handleAwardChange = (event: any) => {
        const check = /^[0-9\b]+$/;
        setAward(event.target.value);
        if (event.target.value.match(check)) {
            setAwardCheck(true);
            console.log('passCheck')
        } else {
            setAwardCheck(false);
            console.log('failCheck')
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
                if (postDoc?.author == session?.auth?.uid) {
                    setPostSelf(true)
                }
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
        const newReply = { comment: replyText, parent: reply, thread: postid, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid, authorName: self.username, upvotes: 0, selected: 0, edit: '' }
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
        const newComment = { comment: answer, parent: postid, thread: postid, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid, authorName: self.username, upvotes: 0, selected: 0 }
        await functions().httpsCallable('createComment')(newComment).then(async () => {
            setComments(await getComments(postid))
            setNumComments(numComments + 1)
            setCommentsDone(true);
            setHandling(false);
            setActiveAnswer(false);
        })
    }

    const handleReportChange = (event: any) => {
        setReportMessage(event.target.value);
    }

    const handleTitleChange = (event: any) => {
        setEditTitle(event.target.value)
        if (event.target.value.length <= 0) {
            setTitleErr('Title Required.')
        } else {
            setTitleErr('')
        }
    }

    const handleBountyChange = (event: any) => {
        const check = /^[0-9\b]+$/;
        setEditBounty(event.target.value);
        if (event.target.value.match(check) && Number(event.target.value) >= Number(post.bounty)) {
            setEditBountyCheck(true);
            setBountyErr('')
            console.log('passCheck')
        } else {
            setEditBountyCheck(false);
            setBountyErr('Cannot decrease bounty.')
            console.log('failCheck')
        }
    }

    const handleEditChange = (event: any) => {
        setEditText(event.target.value)
    }

    /*
    <Button variant="primary" size="sm" onClick={() => { functions().httpsCallable('chooseAwardCredits')({ author: object.data.author, bounty: post.bounty, post: postid, comment: object.id }) }}>Award</Button>
    */
    //a feed object
    const feedCard = (object: { id: string; data: { comment: string; timestamp: { seconds: number, nanoseconds: number }; author: string; authorName: string; parent: string; thread: string; upvotes: number; selected: number; edit: string }; replies: any[] }) => {
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
                
                {object.data.selected > 0 ?
                    <Row>
                        <Col>
                            <p style={{ fontSize: 20 }}>{`@${object.data.authorName}`}</p>
                            <p className={styles.fontLess}> {object.data.comment}</p>
                            <p className={styles.fontLess}> {object.data.edit}</p>
                        </Col>
                        <Col xs={3} md={2}>
                            <Button variant="success" size="sm">{object.data.selected} cr.</Button>
                        </Col>
                    </Row>
                    :
                    postSelf ?
                        object.data.author !== session.auth?.uid ?
                        <Row>
                            <Col>
                                <p style={{ fontSize: 20 }}>{`@${object.data.authorName}`}</p>
                                <p className={styles.fontLess}> {object.data.comment}</p>
                                <p className={styles.fontLess}> {object.data.edit}</p>
                            </Col>
                            <Col xs={3} md={2}>
                                <Button variant="primary" size="sm" onClick={() => { 
                                    setCommentAuthorName(object.data.authorName)
                                    setCommentAuthor(object.data.author)
                                    setCommentID(object.id)
                                    setAwardModalShow(true) }}>Award</Button>
                            </Col>
                        </Row>
                        :
                            <div>
                                <p style={{ fontSize: 20 }}>{`@${object.data.authorName}`}</p>
                                <p className={styles.fontLess}> {object.data.comment}</p>
                                <p className={styles.fontLess}> {object.data.edit}</p>
                            </div>
                        :
                        <div>
                            <p style={{ fontSize: 20 }}>{`@${object.data.authorName}`}</p>
                            <p className={styles.fontLess}> {object.data.comment}</p>
                            <p className={styles.fontLess}> {object.data.edit}</p>
                        </div>

                }



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
                        <Button disabled={auth().currentUser?.emailVerified === false} variant="light" size="sm" onClick={() => { setReply(object.id) }}>Reply</Button>
                    
                    {' '} - {message}
                    {' - '}
                    &nbsp;
                    <Button style={{marginTop: 8}} disabled={!session.auth} size="sm" variant='outline-danger' onClick={() => {
                        setReportAuthorName(object.data.authorName)
                        setReportID(object.id)
                        setReportModalShow(true)
                    }}>
                        ⚐
                    </Button>
                    &nbsp;
                    &nbsp;
                    {object.data.author == session.auth?.uid ?
                        <Button size="sm" style={{ marginTop: 8 }} variant='outline-success' onClick={() => {
                            let replies = 0;
                            if (object.replies && object.replies.length > 0) {
                                replies = object.replies.length
                            }
                            setEditCollection('comments')
                            setEditID(object.id)
                            if (replies == 0 && object.data.selected == 0) {
                                setFullEdit(true)
                                setEditText(object.data.comment)
                            } else {
                                setFullEdit(false)
                                setReadOnlyText(object.data.comment)
                                if (object.data.edit.length > 0) {
                                    setEditText(object.data.edit)
                                } else {
                                    setEditText('EDIT: ')
                                }
                            }

                            setEditModalShow(true)
                        }}>Edit</Button>
                        :
                        ''}
&nbsp;
                    &nbsp;
                    {object.data.author == session.auth?.uid && object.data.selected == 0 ?
                        <Button size="sm" style={{marginTop: 8}} variant='outline-danger' onClick={() => { 
                            let replies = 0;
                            if (object.replies && object.replies.length > 0) {
                                replies = object.replies.length
                            }
                            setDeleteCollection('comments')
                            setDeleteID(object.id)
                            setNumReplies(replies)
                            setDeleteSelected(object.data.selected)
                            setDeleteModalShow(true) }}>Delete</Button>
                    :
                    ''}
                    
                    
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
    const feedView = (feedList: { id: string; data: { comment: string; timestamp: { seconds: number; nanoseconds: number }; author: string; authorName: string; parent: string; thread: string; upvotes: number; selected: number; edit: string }; replies: any[] }[]) => {
        const feedItems = feedList.map((object: { id: string; data: { comment: string; timestamp: { seconds: number, nanoseconds: number }; author: string; authorName: string; parent: string; thread: string; upvotes: number; selected: number; edit: string }; replies: any[] }) => <div key={object.id} style={{ paddingTop: 15 }}>{feedCard(object)}</div>
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
            <NavBar />
                <Modal show={awardModalShow} onHide={() => { setAwardModalShow(false) }}>
                    <Modal.Header closeButton>
                        <Modal.Title>Award @{commentAuthorName}!</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Awards cannot be taken back once submitted.
                        
                    </Modal.Body>
                    <Modal.Footer>
                        <InputGroup>
                            <Form.Control placeholder="How many credits?" onChange={handleAwardChange} value={award} />
                            <Form.Text>{err}</Form.Text>
                        </InputGroup>
                        {awardHandling ? 
                            <Button disabled>
                                <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            />
                            </Button>
                            :
                            <Button onClick={() => {
                                console.log('award = ', award)
                                if (award > Number(post.bounty) + Number(self.credits)) {
                                    setErr(`You have ${Number(post.bounty) + Number(self.credits)} credits to give.`)
                                } else if (awardCheck == false || award < 1) {
                                    setErr(`Input at least 1 credit.`)
                                } else {
                                    setAwardHandling(true)
                                    functions().httpsCallable('chooseAwardCredits')({ author: commentAuthor, bounty: Number(post.bounty), post: postid, comment: commentID, award: Number(award) }).then(() => {
                                        setAwardModalShow(false)
                                        window.location.reload()
                                    })
                                }
                            }}>Award</Button>
                            }
                        
                    </Modal.Footer>
                </Modal>

                <Modal show={deleteModalShow} onHide={() => {
                    setDeleteModalShow(false)
                }}>
                    <Modal.Header>
                        <Modal.Title>Delete</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Are you sure you want to delete this post?
                    </Modal.Body>
                    <Modal.Footer>
                        {
                            deleteHandling ?
                            <Button disabled variant="danger">
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                />
                            </Button>
                            :
                            <Button variant="danger" onClick={() => {
                                setDeleteHandling(true)
                                if (deleteCollection === 'posts') {
                                    functions().httpsCallable('deletePost')({ collect: 'posts', id: postid, numReplies: Number(numComments), awarded: post.awarded, bounty: post.bounty }).then(() => {
                                        window.location.reload()
                                    })
                                } else {
                                    functions().httpsCallable('deletePost')({ collect: deleteCollection, id: deleteID, numReplies: Number(numReplies), awarded: Number(deleteSelected) }).then(async () => {
                                        setDeleteModalShow(false)
                                        setComments(await getComments(postid))
                                        setNumComments(numComments - 1)
                                        setCommentsDone(true);
                                        setDeleteHandling(false);
                                    })
                                }

                            }}
                            >Confirm</Button>
                        }
                        
                    </Modal.Footer>
                </Modal>

            <Modal show={editModalShow} onHide={() => {
                setEditModalShow(false)
            }}>
                <Modal.Header>
                    <Modal.Title>Edit</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {fullEdit ?
                    <InputGroup>
                    {editCollection === 'posts' ?
                    <div>
                                    <p style={{marginBottom: 10}}>Edit Title</p>
                                    <Form.Text className='text-danger'>{titleErr}</Form.Text>
                                    <Form.Control style={{ marginBottom: 20 }}onChange={handleTitleChange} value={editTitle} />
                                    <p style={{ marginBottom: 10 }}>Edit Description</p>
                                    <Form.Control style={{ marginBottom: 20 }} as="textarea" rows={3} onChange={handleEditChange} value={editText} />
                                    <p style={{ marginBottom: 10 }}>Edit Bounty</p>
                                    <Form.Control onChange={handleBountyChange} value={editBounty} />

                                    <Form.Text className='text-danger'>{bountyErr}</Form.Text>
                    </div>
                                
                    :
                                <Form.Control as="textarea" rows={3} onChange={handleEditChange} value={editText} />
                    }
                        
                    </InputGroup>
                    :
                    editCollection === 'posts' ?
                    <div>
                                <p style={{ marginBottom: 10 }}>Title</p>
                                <Form.Text className='text-danger'>{titleErr}</Form.Text>
                                <Form.Control style={{ marginBottom: 20 }} as="text" value={editTitle} readOnly/>
                                <p style={{ marginBottom: 10 }}>Description</p>
                                <Form.Control style={{marginBottom: 20}} as="textarea" value={readOnlyText} readOnly />
                                <p style={{ marginBottom: 10 }}>Edit</p>
                                <Form.Control style={{ marginBottom: 20 }} as="textarea" rows={3} onChange={handleEditChange} value={editText} />
                                <p style={{ marginBottom: 10 }}>Edit Bounty</p>
                                <Form.Control onChange={handleBountyChange} value={editBounty} />
                                <Form.Text className='text-danger'>{bountyErr}</Form.Text>
                    </div>
                    :
                    <div>
                            <Form.Control as="textarea" value={readOnlyText} readOnly />
                            <Form.Control style={{marginTop: 20}} as="textarea" rows={3} onChange={handleEditChange} value={editText} />
                    </div>
                                
                    
                    }
                </Modal.Body>
                <Modal.Footer>
                    {editHandling ?
                    <Button disabled variant="success">
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            />
                    </Button>
                    :
                        <Button variant="success" onClick={() => {
                            setEditHandling(true)
                            if (editCollection === 'posts') {
                                if (editBountyCheck && titleErr === '') {
                                    functions().httpsCallable('editPost')({ collect: editCollection, id: editID, fullEdit: fullEdit, editText: editText, title: editTitle, bounty: editBounty }).then(async () => {
                                        setEditModalShow(false);
                                        window.location.reload()
                                    })
                                } 
                            } else {
                                functions().httpsCallable('editPost')({ collect: editCollection, id: editID, fullEdit: fullEdit, editText: editText }).then(async () => {
                                    setEditModalShow(false);
                                    setComments(await getComments(postid));
                                    setCommentsDone(true);
                                    setEditHandling(false);
                                })
                            }
                            setEditHandling(false);
                            
                        }}>Save</Button>
                    }
                    
                </Modal.Footer>
            </Modal>

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

                                    <Card style={{ marginTop: 15 }}>
                                        {post?.bounty <= 0 ?
                                            <Card.Title style={{ paddingTop: 10 }}>Claimed</Card.Title>
                                            :
                                            <Card.Title style={{ paddingTop: 10 }}>{post?.bounty} cr.</Card.Title>
                                        }
                                        
                                    </Card>
                                </Col>
                            </Row>


                            <Card.Text className={styles.fontLess} style={{ paddingTop: 10 }}>
                                Posted by <a href={`/user/${post?.authorName}`}>{`@${post?.authorName}`}</a> {timeMessage}
                            {' - '}
                            &nbsp;
                            <Button style={{marginTop: 5}} disabled={!session.auth} size="sm" variant='outline-danger' onClick={() => {
                                    setReportAuthorName(post.authorName)
                                    setReportID(postid)
                                    setReportModalShow(true)
                                }}>
                                    ⚐
                            </Button>
                            &nbsp;
                            &nbsp;
                            {postSelf ?
                                    <Button size="sm" style={{ marginTop: 5 }} variant='outline-success' onClick={() => {
                                        setEditCollection('posts')
                                        setEditID(postid)
                                        if (numComments === 0 && post.awarded === false) {
                                            setFullEdit(true)
                                            setEditText(post.desc)
                                        } else {
                                            setFullEdit(false)
                                            setReadOnlyText(post.desc)
                                            if (post.edit && post.edit.length > 0) {
                                                setEditText(post.edit)
                                            } else {
                                                setEditText('EDIT: ')
                                            }
                                        }

                                        setEditTitle(post.title)
                                        setEditBounty(post.bounty)

                                        setEditModalShow(true)
                                    }}>Edit</Button>
                                    :
                                    ''}
                                    &nbsp;
                                    &nbsp;
                            {postSelf && post.awarded == false ?
                                    <Button size="sm" style={{marginTop: 5}} variant='outline-danger' onClick={() => {
                                        setDeleteCollection('posts')
                                        setDeleteID(postid)
                                        setNumReplies(numComments)
                                        setDeleteModalShow(true) }}>Delete Post</Button>
                                    :
                                    ''
                            }
                            
                    

                            </Card.Text>
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
                            auth().currentUser?.emailVerified ?
                            <Button variant="primary" onClick={() => { setActiveAnswer(true) }}>Comment</Button>
                            :
                                <Button disabled variant="primary" onClick={() => { setActiveAnswer(true) }}>Verify Email to Comment</Button>
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
