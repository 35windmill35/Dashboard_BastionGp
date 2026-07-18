import { Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/login/LoginPage'
import { OverviewPage } from '@/pages/overview/OverviewPage'
import { EfficiencyPage } from '@/pages/efficiency/EfficiencyPage'
import { MastersPage } from '@/pages/masters/MastersPage'
import { MechanicsPage } from '@/pages/mechanics/MechanicsPage'
import { BrandsPage } from '@/pages/brands/BrandsPage'
import { RequireAuth } from '@/app/providers/RequireAuth'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <OverviewPage />
          </RequireAuth>
        }
      />
      <Route
        path="/efficiency"
        element={
          <RequireAuth>
            <EfficiencyPage />
          </RequireAuth>
        }
      />
      <Route
        path="/masters"
        element={
          <RequireAuth>
            <MastersPage />
          </RequireAuth>
        }
      />
      <Route
        path="/mechanics"
        element={
          <RequireAuth>
            <MechanicsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/brands"
        element={
          <RequireAuth>
            <BrandsPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
