import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { SettingsProvider } from './config/SettingsContext'
import { TaskProvider } from './state/TaskContext'
import Dashboard from './pages/Dashboard'
import Schools from './pages/Schools'
import Syllabus from './pages/Syllabus'
import DataPage from './pages/DataPage'
import Practice from './pages/Practice'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <SettingsProvider>
      <TaskProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/schools" element={<Schools />} />
              <Route path="/syllabus" element={<Syllabus />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/data" element={<DataPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </HashRouter>
      </TaskProvider>
    </SettingsProvider>
  )
}
