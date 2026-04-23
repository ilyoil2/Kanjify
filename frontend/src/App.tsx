import KanjiDashboard from "./components/kanji-dashboard"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="kanjify-theme">
      <KanjiDashboard />
      <Toaster position="bottom-right" richColors />
    </ThemeProvider>
  )
}

export default App
