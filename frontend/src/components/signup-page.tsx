import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Hash, UserPlus, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SignupPage({ 
  onGuestLogin, 
  onNavigateToLogin 
}: { 
  onGuestLogin: () => void,
  onNavigateToLogin: () => void
}) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) {
      toast.error("모든 필드를 입력해주세요.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8002/api/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("회원가입이 완료되었습니다! 로그인해주세요.")
        onNavigateToLogin()
      } else {
        toast.error(data.error || "회원가입 중 오류가 발생했습니다.")
      }
    } catch (error) {
      console.error("Signup error:", error)
      toast.error("서버와 통신 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      {/* Background patterns - Different color (Indigo) */}
      <div className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none overflow-hidden">
        <Hash className="absolute top-1/4 -left-20 size-96 text-indigo-900 rotate-12" />
        <Hash className="absolute -bottom-10 -right-10 size-64 text-indigo-900 -rotate-12" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-none shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-right-8 duration-500">
        {/* Different accent color (Indigo) */}
        <div className="h-2 bg-indigo-600 w-full" />
        
        <CardHeader className="space-y-1 text-center pt-8 pb-4">
          <div className="flex justify-center mb-4">
            <div className="size-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <UserPlus className="size-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter text-gray-900">
            Create Account
          </CardTitle>
          <CardDescription className="font-medium text-gray-500">
            Kanjify와 함께 한자 공부를 시작하세요
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Username</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Your name" 
                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-12"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
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
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="size-4" />
                  회원가입
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
            className="w-full h-12 rounded-xl border-2 border-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-all"
          >
            로그인 없이 시작하기
          </Button>

          <button 
            onClick={onNavigateToLogin}
            className="flex items-center gap-2 text-xs text-gray-400 font-bold hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="size-3" />
            이미 계정이 있으신가요? 로그인으로 돌아가기
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
