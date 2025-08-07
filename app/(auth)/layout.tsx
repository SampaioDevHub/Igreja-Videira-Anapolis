import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <Image
        src="https://res.cloudinary.com/dqxcs3pwx/image/upload/v1754498972/k8evsjisryc0ihpsrket.avif"
        alt="Background"
        layout="fill"
        objectFit="cover"
        quality={100}
        className="z-0"
      />
      <div className="absolute inset-0 bg-black/50 z-10"></div>

      <div className="relative z-20 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
