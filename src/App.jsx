import { useState, useEffect } from 'react'
import './App.css'

// 백엔드 API 기본 URL (환경변수에서 가져오기)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 디버깅: 환경변수 확인
console.log('Environment variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
})

if (!API_BASE_URL) {
  const errorMsg = 'VITE_API_BASE_URL 환경변수가 설정되지 않았습니다. .env 파일을 확인하고 개발 서버를 재시작하세요.'
  console.error(errorMsg)
  throw new Error(errorMsg)
}

function App() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  // 할일 목록 조회
  const fetchTodos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(API_BASE_URL)
      const data = await response.json()
      if (response.ok) {
        setTodos(data.todos || [])
      } else {
        setError(data.error || '할일을 불러오는데 실패했습니다')
      }
    } catch (err) {
      setError('서버에 연결할 수 없습니다')
      console.error('Error fetching todos:', err)
    } finally {
      setLoading(false)
    }
  }

  // 할일 생성
  const createTodo = async (title) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })
      const data = await response.json()
      if (response.ok) {
        await fetchTodos() // 목록 새로고침
        setNewTodoTitle('')
      } else {
        setError(data.error || '할일 생성에 실패했습니다')
      }
    } catch (err) {
      setError('서버에 연결할 수 없습니다')
      console.error('Error creating todo:', err)
    }
  }

  // 할일 수정
  const updateTodo = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      const data = await response.json()
      if (response.ok) {
        await fetchTodos() // 목록 새로고침
        setEditingId(null)
        setEditTitle('')
      } else {
        setError(data.error || '할일 수정에 실패했습니다')
      }
    } catch (err) {
      setError('서버에 연결할 수 없습니다')
      console.error('Error updating todo:', err)
    }
  }

  // 할일 삭제
  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.ok) {
        await fetchTodos() // 목록 새로고침
      } else {
        setError(data.error || '할일 삭제에 실패했습니다')
      }
    } catch (err) {
      setError('서버에 연결할 수 없습니다')
      console.error('Error deleting todo:', err)
    }
  }

  // 초기 로딩
  useEffect(() => {
    fetchTodos()
  }, [])

  // 할일 추가 핸들러
  const handleAddTodo = (e) => {
    e.preventDefault()
    if (newTodoTitle.trim()) {
      createTodo(newTodoTitle.trim())
    }
  }

  // 완료 상태 토글
  const handleToggleComplete = (todo) => {
    updateTodo(todo._id, { completed: !todo.completed })
  }

  // 수정 시작
  const startEdit = (todo) => {
    setEditingId(todo._id)
    setEditTitle(todo.title)
  }

  // 수정 취소
  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  // 수정 완료
  const handleSaveEdit = (id) => {
    if (editTitle.trim()) {
      updateTodo(id, { title: editTitle.trim() })
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">할일 관리</h1>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="close-error">×</button>
          </div>
        )}

        {/* 할일 추가 폼 */}
        <form onSubmit={handleAddTodo} className="add-todo-form">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="새 할일을 입력하세요..."
            className="todo-input"
          />
          <button type="submit" className="add-button">
            추가
          </button>
        </form>

        {/* 할일 목록 */}
        <div className="todos-container">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : todos.length === 0 ? (
            <div className="empty-state">할일이 없습니다</div>
          ) : (
            <ul className="todo-list">
              {todos.map((todo) => (
                <li key={todo._id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                  {editingId === todo._id ? (
                    // 수정 모드
                    <div className="edit-mode">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="edit-input"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(todo._id)
                          } else if (e.key === 'Escape') {
                            cancelEdit()
                          }
                        }}
                      />
                      <div className="edit-buttons">
                        <button
                          onClick={() => handleSaveEdit(todo._id)}
                          className="save-button"
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="cancel-button"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 표시 모드
                    <>
                      <div className="todo-content">
                        <input
                          type="checkbox"
                          checked={todo.completed || false}
                          onChange={() => handleToggleComplete(todo)}
                          className="todo-checkbox"
                        />
                        <span className="todo-title">{todo.title}</span>
                      </div>
                      <div className="todo-actions">
                        <button
                          onClick={() => startEdit(todo)}
                          className="edit-button"
                          disabled={todo.completed}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => deleteTodo(todo._id)}
                          className="delete-button"
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
