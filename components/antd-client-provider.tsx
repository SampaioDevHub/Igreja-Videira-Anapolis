"use client"

import type React from "react"
import "@ant-design/v5-patch-for-react-19"

export function AntdClientProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
