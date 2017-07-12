import React, { Component } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'

import './App.css'
import base, { auth } from './base'
import Main from './Main'
import SignIn from './SignIn'

class App extends Component {
  constructor() {
    super()

    this.state = {
      notes:  {},
      uid: null,
    }
  }

  componentWillMount = () => {
    this.getUserFromLocalStorage()
    auth.onAuthStateChanged(
      (user) => {
        if (user) {
          // signed in
          this.handleAuth(user)
        } else {
          // signed out
          this.handleUnauth()
        }
      }
    )
  }

  getUserFromLocalStorage = () => {
    const uid = localStorage.getItem('uid')
    if (!uid) return
    this.setState({ uid })
  }

  syncNotes = () => {
    this.bindingRef = base.syncState(
      `notes/${this.state.uid}`,
      {
        context: this,  // what object the state is on
        state: 'notes', // which property to sync
      }
    )
  }

  setCurrentNote = (note) => {
    this.setState({ currentNoteId: note.id })
  }

  resetCurrentNote = () => {
    this.setCurrentNote({ id: null })
  }

  saveNote = (note) => {
    let shouldRedirect = false
    if (!note.id) {
      note.id = Date.now()
      shouldRedirect = true
    }

    const notes = {...this.state.notes}
    notes[note.id] = note

    this.setState({ notes })

    if(shouldRedirect){
      this.props.history.push(`/notes/${note.id}`)
    }
  }

  removeNote = (note) => {
    const notes = {...this.state.notes}
    notes[note.id] = null

    this.setState({ notes })
    this.props.history.push('/notes')
  }

  signedIn = () => {
    return this.state.uid
  }

  handleAuth = (user) => {
    localStorage.setItem('uid', user.uid)
    this.setState(
      { uid: user.uid },
      this.syncNotes
    )
  }

  handleUnauth = () => {
    localStorage.removeItem('uid')

    if (this.bindingRef) {
      base.removeBinding(this.bindingRef)
    }

    this.setState({
      uid: null,
      notes: {},
    })

    this.resetCurrentNote()
  }

  signOut = () => {
    auth.signOut()
  }

  render() {
    const actions = {
      saveNote: this.saveNote,
      removeNote: this.removeNote,
      signOut: this.signOut,
    }

    const noteData = {
      notes: this.state.notes,
    }

    return (
      <div className="App">
        <Switch>
          <Route
            path="/sign-in"
            render={() => (
              this.signedIn()
                ? <Redirect to="/notes" />
                : <SignIn />
            )}
          />
          <Route
            path="/notes"
            render={() => (
              this.signedIn()
                ? <Main
                    {...actions}
                    {...noteData}
                  />
                : <Redirect to="/sign-in" />
            )}
          />
          <Route render={() => (
            this.signedIn()
              ? <Redirect to="/notes" />
              : <Redirect to="/sign-in" />
          )} />
        </Switch>
      </div>
    )
  }
}

export default App