import React, { useState, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { functions, auth, firestore } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card, Form } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Post.module.css'

const PostPage: React.FC = () => {
    const firebase = useFirebase()
    const session = useSession()

    const [channels, setChannels] = useState<Array<string>>([])
    const [channelList, setChannelList] = useState<Array<string>>([])
    const [allChannels, setAllChannels] = useState<Array<string>>(['Arts', 'Business', 'Computer Science', 'Economics', 'Finance', 'History', 'Humanities', 'French', 'Mandarin', 'Spanish', 'Languages (General)', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'Sciences (General)', 'Psychology', 'Sociology', 'Social Sciences (General)', 'General'])
    const [title, setTitle] = useState<string>("")
    const [description, setDescription] = useState<string>("")

    const [err, setErr] = useState<string>("")

    const [handling, setHandling] = useState<boolean>(false)

    const [input, setInput] = useState<string>("")

    const [name, setName] = useState<string>("")

    useEffect(() => {
        if (!session.auth) {
            window.location.href = "/"
        } else {
            const getUser = async () => {
                const user = await firestore().collection('users').doc(session.auth?.uid).get()
                setName(user.data()?.username)
            }
            getUser()
        }
    }, [session, firebase])

    const handleChannelChange = (event: any) => {
        setInput(event.target.value)
        if (event.target.value.length > 0) {
            let strKeyword = event.target.value
            let subjects = []
            for (let i = 0; i < allChannels.length; i++) {
                if (allChannels[i].replace(/[^a-zA-Z0-9]/g, "").substr(0, strKeyword.length).toLowerCase() == strKeyword.toLowerCase()) {
                    subjects.push(allChannels[i])
                }
            }
            setChannelList(subjects)
        } else {
            setChannelList([])
        }
    }

    const subjectsView = () => {
        const subjectObjects = channelList.map((d) => <Button variant="outline-dark" key={d} style={{ marginRight: 15, marginBottom: 15 }} onClick={() => {
            if (channels.length > 9) {
                setErr('Maximum 10 channels')
            } else {
                setErr('')
                setInput('')
                setChannelList([])
                if (channels.indexOf(d) != -1) {
                    return
                } else {
                    setChannels([...channels, d])
                }

            }
        }}>{d}</Button>)
        return (
            <div>
                {subjectObjects}
            </div>
        )
    }

    const selectedView = () => {
        const subjectObjects = channels.map((d) => <Button variant="dark" key={d} style={{ marginRight: 15, marginBottom: 15 }} onClick={() => {
            var array = [...channels]; // make a separate copy of the array
            var index = array.indexOf(d)
            if (index !== -1) {
                array.splice(index, 1);
                setChannels(array);
            }
            if (channels.length < 11) {
                setErr('')
            }
        }}>{d}</Button>)
        return (
            <div>
                {subjectObjects}
            </div>
        )
    }

    const postToView = () => {
        const subjectObjects = channels.map((d) => <p key={d}>{(channels.indexOf(d) == 0) ? `to ${d}` : `, ${d}`}</p>)
        return (
            <Row style={{ marginTop: 15, marginLeft: 15 }}>
                {subjectObjects}
            </Row>
        )
    }

    const handleTitleChange = (event: any) => {
        setTitle(event.target.value)
    }

    const handleDescriptionChange = (event: any) => {
        setDescription(event.target.value)
    }

    const handleSubmit = async (event: any) => {
        setHandling(true);
        event.preventDefault()
        console.log(title)
        console.log(description)
        let newPost = null;
        if (channels.length == 0) {
            newPost = { title: title, desc: description, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid, channels: ['General'], authorName: name }
        } else {
            newPost = { title: title, desc: description, timestamp: firestore.Timestamp.now(), author: session?.auth?.uid, channels: channels, authorName: name, upvotes: 0 }
        }
        await functions().httpsCallable('createPost')(newPost)
        window.location.href = "/"
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
                    <Button variant="light" onClick={() => {
                        window.location.reload()
                        firebase.doSignOut()
                    }}>
                        sign out
                    </Button>
                </Nav>
            </Navbar>
            <Container className={styles.paddingTop}>
                <div>
                    <h1 style={{ paddingBottom: 15 }}>Create a new post</h1>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="channels">
                            <Form.Label>Channels</Form.Label>
                            <Row style={{ marginLeft: 10 }}>
                                {selectedView()}
                                {subjectsView()}
                            </Row>

                            <Form.Control type="text" placeholder="What subjects?" onChange={handleChannelChange} value={input} />
                            <Form.Text className="text-danger">
                                {err}
                            </Form.Text>
                        </Form.Group>

                        <Form.Group controlId="title">
                            <Form.Label>Title</Form.Label>
                            <Form.Control required type="text" placeholder="What question?" onChange={handleTitleChange} />
                        </Form.Group>

                        <Form.Group controlId="description">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="Add more details if necessary." onChange={handleDescriptionChange} />
                        </Form.Group>

                        {handling ?
                            <Button variant="primary" disabled style={{ marginTop: 15 }}>
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
                                Post
                        </Button>

                        }


                        {postToView()}

                    </Form>
                </div>
            </Container>
        </div>
    )
}


export { PostPage }
