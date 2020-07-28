import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Form, Spinner, Modal, InputGroup } from 'react-bootstrap'
import { useFirebase, Firebase } from '../components/Firebase'
import { useSession } from '../components/Session'
import { functions, auth, firestore } from 'firebase'
import styles from './FeedView.module.css'

const FeedView: React.FC<any> = ({ feedList, nowSeconds, userDoc, upvoted, downvoted, setUpvoted, setDownvoted, setChanged, changed, commentCard }) => {
    const firebase = useFirebase()
    const session = useSession()

    const [reportMessage, setReportMessage] = useState<string>('')
    const [reportAuthorName, setReportAuthorName] = useState<string>('')
    const [reportID, setReportID] = useState<string>('')
    const [reportHandling, setReportHandling] = useState<boolean>(false)
    const [reportDone, setReportDone] = useState<boolean>(false);

    const [reportModalShow, setReportModalShow] = useState<boolean>(false)

    const [commentsExpand, setCommentsExpand] = useState<boolean>(false)
    const [commentsDone, setCommentsDone] = useState<boolean>(false)

    const [comments, setComments] = useState<any>(<div></div>)
    const [postTitle, setPostTitle] = useState<string>('')
    const [postDesc, setPostDesc] = useState<string>('')
    const [postid, setPostid] = useState<string>('')

    const handleReportChange = (event: any) => {
        setReportMessage(event.target.value);
    }

    //a feed object
    const feedCard = (object: any, commentCard: any) => {

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

        const getComments = async (id: string) => {
            try {
                var docList: any[] = []
                const commentsList = await firebase.db.collection('comments').where('parent', '==', id).orderBy('upvotes', 'desc').limit(3).get()

                console.log('commentsList = ', commentsList)
                if (commentsList.empty || commentsList == null) {
                    console.log('No matching documents')
                    setCommentsDone(true)
                    return;
                }

                commentsList.forEach(doc => {
                    docList = [...docList, { id: doc.id, data: doc.data() }];
                });

                const commentItems = docList.map((object: any) => <div key={object.id} style={{ paddingTop: 15 }}>{feedCard(object, true)}</div>
                )

                setComments(commentItems)
                setCommentsDone(true)
                return (docList)

            } catch (e) {
                console.log(e)
            }
        }

        const channelView = () => {
            const subjectObjects = object.data.channels?.map((d: string) => <p key={d}>{(object.data.channels.indexOf(d) == 0) ? `#${d}` : `, #${d}`}</p>)
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

        if (commentCard) {
            return (

                <div className={styles.borderLeft} style={{ marginBottom: 10, paddingLeft: 10, paddingTop: 10 }}>

                    {object.data.selected > 0 ?
                        <Row>
                            <Col>
                                <p style={{ fontSize: 20 }}>{`@${object.data.authorName}`}</p>
                                <p className={styles.fontLess}> {object.data.comment}</p>
                            </Col>
                            <Col xs={3} md={2}>
                                <Button variant="success" size="sm">{object.data.selected} cr.</Button>
                            </Col>
                        </Row>
                        :
                        <div>
                            <p style={{ fontSize: 20 }}>{`@${object.data.authorName}`}</p>
                            <p className={styles.fontLess}> {object.data.comment}</p>
                        </div>

                    }



                    <p className={styles.fontLess}>
                        <Button disabled={!session.auth} active={upvoted.includes(object.id)} size="sm" variant="outline-dark" onClick={() => {
                            handleVote(true)
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
                            handleVote(false)
                            setChanged(!changed)
                        }}>▼</Button>
                        &nbsp;
                        {' - '}

                        {message} {' - '} &nbsp;
                        <Button size="sm" variant='outline-dark' onClick={() => {
                            window.location.href = `/post/${object.data.thread}`
                        }}>
                            See Post
                    </Button>
                        {' - '} &nbsp;
                        <Button disabled={!session.auth} size="sm" variant='outline-danger' onClick={() => {
                            setReportAuthorName(object.data.authorName)
                            setReportID(object.id)
                            setReportModalShow(true)
                        }}>
                            ⚐
                    </Button>
                    </p>

                </div>

                //
            )
        } else {
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
                                    <Card>
                                        {object.data.bounty <= 0 ?
                                            <Card.Title style={{ paddingTop: 10 }}>Claimed</Card.Title>
                                            :
                                            <Card.Title style={{ paddingTop: 10 }}>{object.data.bounty} cr.</Card.Title>
                                        }

                                    </Card>

                                </Col>
                            </Row>
                        }

                        <Card.Text> {object.data.desc}</Card.Text>
                        <Card.Text> {object.data.edit}</Card.Text>


                        <Card.Text style={{ paddingTop: 10 }}>
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
                                <Button variant="light" onClick={() => {
                                    getComments(object.id)
                                    setPostTitle(object.data.title)
                                    setPostDesc(object.data.desc)
                                    setPostid(object.id)
                                    setCommentsExpand(true)
                                }}>{object.numComments} comment</Button>
                                :
                                <Button variant="light" onClick={() => {
                                    getComments(object.id)
                                    setPostTitle(object.data.title)
                                    setPostDesc(object.data.desc)
                                    setPostid(object.id)
                                    setCommentsExpand(true)
                                }}>{object.numComments} comments</Button>
                            }

                            {' '} - posted by <a href={`/user/${object.data.authorName}`}>{`@${object.data.authorName}`}</a> - {message}
                            {' - '}
                        &nbsp;
                        <Button disabled={!session.auth} size="sm" style={{ marginTop: 8 }} variant='outline-danger' onClick={() => {
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


    }

    const feedItems = feedList.map((object: any) => <div key={object.id} style={{ paddingTop: 15 }}>{feedCard(object, commentCard)}</div>
    )

    return (
        <div>
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
            <Modal show={commentsExpand} onHide={() => {
                setCommentsExpand(false)
                setComments([])
                setCommentsDone(false)

            }}>
                <Modal.Header closeButton>
                    <Modal.Title>{postTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{postDesc}</p>
                    {commentsDone ?
                        comments
                        :
                        <Spinner animation="border"></Spinner>}
                </Modal.Body>
                <Modal.Footer>
                    <Button href={`/post/${postid}`}>See more</Button>
                </Modal.Footer>
            </Modal>
            {feedItems}
        </div>

    )
}

export { FeedView }