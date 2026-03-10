import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewInterview from './pages/NewInterview'
import InterviewDetail from './pages/InterviewDetail'
import Report from './pages/Report'
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<NewInterview />} />
          <Route path="interviews/:id" element={<InterviewDetail />} />
          <Route path="reports/:id" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
