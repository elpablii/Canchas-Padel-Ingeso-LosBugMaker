import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      
      <h1>Canchas Pádel Ucenin</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          contador es {count}
        </button>
        <p>
          FrontEnd en construccion
        </p>
      </div>
      <p className="read-the-docs">
        Se va a ir agregando nuevas funciones a medida que pasen los dias
      </p>
    </>
  )
}

export default App
