import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import NewInterview from './pages/NewInterview'
import InterviewDetail from './pages/InterviewDetail'
import Report from './pages/Report'

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || ''
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/new" element={<NewInterview />} />
          <Route path="/app/interviews/:id" element={<InterviewDetail />} />
          <Route path="/app/reports/:id" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
