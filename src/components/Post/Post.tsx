import React, { useState, useEffect } from 'react'
import { useFirebase, Firebase } from '../Firebase'
import { functions } from 'firebase'
import { Navbar, Nav, Button, ButtonGroup, Container, Row, Col, Spinner, Jumbotron, Image, ProgressBar, OverlayTrigger, Popover, Carousel, Card, Form } from 'react-bootstrap'
import { useSession } from '../Session'
import styles from './Post.module.css'
import { firestore } from 'firebase'




const PostPage: React.FC = () => {

    const [title, setTitle] = useState <string>("")
    const [description, setDescription] = useState<string>("")


    const handleTitleChange=(event:any)=> {
        setTitle(event.target.value)
    }

    const handleDescriptionChange=(event:any)=> {
        setDescription(event.target.value)
    }

    const handleSubmit = async (event:any) => {
        event.preventDefault()
        console.log(title)
        console.log(description)
        const newPost = {title: title, desc: description}
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

                        <Button variant="outline-dark" href="/login" style={{ marginRight: 10 }}>
                            log in
                        </Button>

                        <Button variant="light" href="/signup">
                            sign up
                        </Button>
                    </Nav>
                </Navbar>
                <Container className={styles.paddingTop}>
                    <div>
                        <h1 style={{ paddingLeft: 22 }}>Post</h1>
                        <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="title">
                            <Form.Label>CREATE POST</Form.Label>
                            <Form.Control type="text" placeholder="Write a question" onChange={handleTitleChange} />
                        </Form.Group>

                        <Form.Group controlId="description">
                            <Form.Label>DESCRIPTION</Form.Label>
                            <Form.Control as="textarea" rows="3" placeholder="What's your question?" onChange={handleDescriptionChange} />
                        </Form.Group>

                        <Button variant="primary" type="submit">
                            POST
                        </Button>
                        </Form>
                    </div>
                </Container>
            </div>
        )
    }


export { PostPage }
