'use client'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Activity, User, LogOut, Menu } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Activity className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-primary">MedSnap</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                router.pathname === '/' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
              }`}>
                Home
              </Link>
              <Link href="/dashboard" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                router.pathname === '/dashboard' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
              }`}>
                Dashboard
              </Link>
              <Link href="/about" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                router.pathname === '/about' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
              }`}>
                About
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative rounded-full bg-background p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <span className="sr-only">Open user menu</span>
                  <User className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href="/profile" className="flex items-center">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="flex items-center">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <button className="flex items-center text-destructive" onClick={() => {/* Handle logout */}}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
                  <span className="sr-only">Open main menu</span>
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href="/" className="flex items-center">
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/dashboard" className="flex items-center">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/about" className="flex items-center">
                    About
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/profile" className="flex items-center">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="flex items-center">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <button className="flex items-center text-destructive" onClick={() => {/* Handle logout */}}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}