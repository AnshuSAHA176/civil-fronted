import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  Check,
  LoaderCircle,
  Send,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'

import {
  sendAssistantMessage,
  resumeAssistantApproval,
} from '../../features/assistant.api'

import { getApiError } from '../../services/apiClient'
import { Alert } from '../../components/common/Alert'
import { Button } from '../../components/common/Button'


function Message({ message }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`assistant-message ${
        isUser
          ? 'assistant-message-user'
          : 'assistant-message-ai'
      }`}
    >
      <div
        className="assistant-message-avatar"
        aria-hidden="true"
      >
        {isUser ? (
          <User size={16} />
        ) : (
          <Bot size={16} />
        )}
      </div>

      <div className="assistant-message-body">
        <span className="assistant-message-label">
          {isUser ? 'You' : 'CivicAI'}
        </span>

        <div className="assistant-message-content">
          {message.content}
        </div>
      </div>
    </div>
  )
}


export default function Assistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [approval, setApproval] = useState(null)

  const endRef = useRef(null)


  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, loading, approval])


  const submit = async (event) => {
    event?.preventDefault()

    const content = input.trim()

    if (!content || loading || approval) {
      return
    }

    setError('')
    setInput('')

    setMessages((current) => [
      ...current,
      {
        role: 'user',
        content,
      },
    ])

    setLoading(true)

    try {
      const { data } = await sendAssistantMessage(content)

      if (data?.pending_approval) {
        setApproval(
          data.interrupt || {
            message:
              'Approval is required for this action.',
          }
        )
      } else if (data?.answer) {
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            content: data.answer,
          },
        ])
      } else {
        setError(
          'The assistant returned an unexpected response.'
        )
      }
    } catch (requestError) {
      setError(
        getApiError(requestError).message
      )
    } finally {
      setLoading(false)
    }
  }


  const respondToApproval = async (value) => {
    if (loading) {
      return
    }

    setError('')
    setLoading(true)

    try {
      const { data } =
        await resumeAssistantApproval(value)

      setApproval(null)

      if (data?.pending_approval) {
        setApproval(
          data.interrupt || {
            message:
              'Another approval is required.',
          }
        )
      } else if (data?.answer) {
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            content: data.answer,
          },
        ])
      } else {
        setError(
          'The assistant returned an unexpected response.'
        )
      }
    } catch (requestError) {
      setError(
        getApiError(requestError).message
      )
    } finally {
      setLoading(false)
    }
  }


  return (
    <section className="assistant-page">

      <div className="assistant-header">
        <div>
          <p className="eyebrow">
            Citizen services
          </p>

          <h1>
            CivicAI Assistant
          </h1>

          <p>
            Ask about your complaints and RTI requests,
            or request help with CivicAI services.
          </p>
        </div>
      </div>


      <div className="assistant-card">

        <div
          className="assistant-conversation"
          aria-live="polite"
        >

          {messages.length === 0 && !loading && (
            <div className="assistant-welcome">

              <div className="assistant-welcome-icon">
                <Bot size={22} />
              </div>

              <h2>
                How can I help?
              </h2>

              <p>
                Try asking about your complaints,
                complaint history, or RTI requests.
              </p>

              <div className="assistant-suggestions">

                <button
                  type="button"
                  onClick={() =>
                    setInput('Show my complaints')
                  }
                >
                  Show my complaints
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setInput('Show my RTIs')
                  }
                >
                  Show my RTIs
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      'What is the status of my latest complaint?'
                    )
                  }
                >
                  Latest complaint status
                </button>

              </div>
            </div>
          )}


          {messages.map((message, index) => (
            <Message
              key={`${message.role}-${index}`}
              message={message}
            />
          ))}


          {loading && (
            <div className="assistant-typing">

              <LoaderCircle
                size={17}
                className="assistant-spin"
              />

              <span>
                CivicAI is working…
              </span>

            </div>
          )}


          {approval && (
            <div
              className="assistant-approval"
              role="alertdialog"
              aria-label="Approval required"
            >

              <div className="assistant-approval-icon">
                <ShieldCheck size={20} />
              </div>

              <div className="assistant-approval-copy">

                <strong>
                  Approval required
                </strong>

                <p>
                  {approval.message ||
                    'Do you approve this action?'}
                </p>

                <div className="assistant-approval-actions">

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      respondToApproval('no')
                    }
                    disabled={loading}
                  >
                    <X size={16} />
                    Decline
                  </Button>


                  <Button
                    type="button"
                    onClick={() =>
                      respondToApproval('yes')
                    }
                    disabled={loading}
                  >
                    <Check size={16} />
                    Approve
                  </Button>

                </div>
              </div>

            </div>
          )}


          {error && (
            <Alert tone="danger">
              {error}
            </Alert>
          )}


          <div ref={endRef} />

        </div>


        <form
          className="assistant-composer"
          onSubmit={submit}
        >

          <label
            className="sr-only"
            htmlFor="assistant-message"
          >
            Message CivicAI
          </label>

          <textarea
            id="assistant-message"
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey
              ) {
                event.preventDefault()
                submit(event)
              }
            }}
            placeholder="Ask CivicAI…"
            rows={1}
            disabled={
              loading ||
              Boolean(approval)
            }
          />


          <Button
            type="submit"
            aria-label="Send message"
            disabled={
              !input.trim() ||
              loading ||
              Boolean(approval)
            }
          >
            <Send size={17} />
            <span className="assistant-send-label">
              Send
            </span>
          </Button>

        </form>


        <p className="assistant-note">
          Enter to send · Shift + Enter for a new line
        </p>

      </div>

    </section>
  )
}