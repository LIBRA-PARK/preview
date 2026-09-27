import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { ArrowUpRight, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function App() {
  const [open, setOpen] = useState(false)

  return (
    <main className="min-h-svh bg-background px-6 py-12 text-foreground sm:py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex items-center gap-3 text-sm font-semibold">
          <span className="rounded-xl bg-primary p-2 text-primary-foreground"><Layers size={20} aria-hidden="true" /></span>
          Web Starter
        </header>
        <section className="space-y-5">
          <Badge variant="secondary">Ready to build</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">새로운 아이디어의 시작.</h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            필요한 도구를 갖춘 가벼운 시작점입니다. 이제 나만의 웹 사이트를 만들어 보세요.
          </p>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 준비 완료</CardTitle>
            <CardDescription>React · TypeScript · Tailwind CSS · shadcn/ui · Material UI</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => setOpen(true)}>컴포넌트 확인</Button>
            <Button variant="outline" nativeButton={false} render={<a href="https://ui.shadcn.com/docs" target="_blank" rel="noreferrer" />}>
              shadcn/ui 문서 <ArrowUpRight aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
        <footer className="text-sm text-muted-foreground">작은 시작에서, 좋은 경험으로.</footer>
      </div>
      <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)}>
        <Alert severity="success" variant="filled" onClose={() => setOpen(false)}>
          shadcn/ui와 Material UI가 함께 동작합니다.
        </Alert>
      </Snackbar>
    </main>
  )
}
