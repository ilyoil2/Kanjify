import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Hash, LogIn, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function LoginPage({ 
  onGuestLogin, 
  onLoginSuccess,
  onNavigateToSignup 
}: { 
  onGuestLogin: () => void,
  onLoginSuccess: (user: {username: string, email: string}) => void,
  onNavigateToSignup: () => void 
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8002/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("로그인 성공!")
        onLoginSuccess(data.user)
      } else {
        toast.error(data.error || "로그인에 실패했습니다.")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("서버와 통신 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      {/* Background patterns */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none overflow-hidden">
        <Hash className="absolute -top-10 -left-10 size-64 text-blue-900 rotate-12" />
        <Hash className="absolute top-1/2 -right-20 size-96 text-blue-900 -rotate-12" />
        <Hash className="absolute -bottom-20 left-1/4 size-48 text-blue-900 rotate-45" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-none shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="h-2 bg-blue-600 w-full" />
        <CardHeader className="space-y-1 text-center pt-8 pb-4">
          <div className="flex justify-center mb-4">
            <div className="size-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Hash className="size-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter text-gray-900">
            Kanjify
          </CardTitle>
          <CardDescription className="font-medium text-gray-500">
            한자의 숨겨진 구조를 발견해보세요
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Password</Label>
              <Input 
                id="password" 
                type="password" 
                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="size-4" />
                  로그인
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col gap-4 pb-8">
          <div className="relative w-full py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">OR</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={onGuestLogin}
            className="w-full h-12 rounded-xl border-2 border-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-50 hover:text-blue-700 transition-all"
          >
            로그인 없이 시작하기
          </Button>

          <button 
            onClick={onNavigateToSignup}
            className="text-xs text-gray-400 font-bold hover:text-blue-600 transition-colors"
          >
            아직 계정이 없으신가요? 회원가입
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
