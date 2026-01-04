import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChatbotPage() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chatbot</h1>
          <p className="text-muted-foreground">
            Atendimento com ChatBotKit dentro do painel.
          </p>
        </div>

        <Card className="bg-gradient-to-b from-background to-muted/30">
          <CardHeader>
            <CardTitle>ChatBotKit</CardTitle>
            <CardDescription>
              Interface centralizada com estilo similar ao ChatGPT.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <iframe
              title="ChatBotKit"
              src="https://static.chatbotkit.com/integrations/widget/cmjq9h8at04ekzgfoks6u5bz4/frame"
              className="w-full min-h-[720px] rounded-lg border bg-amber-50"
              allow="clipboard-write; fullscreen"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
