import React from 'react'
import Link from 'next/link'
import { Activity, Facebook, Twitter, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center">
              <Activity className="h-10 w-10 text-primary" />
              <span className="ml-3 text-2xl font-bold text-primary">MedSnap</span>
            </div>
            <p className="text-base text-muted-foreground">
              Revolutionizing emergency care with AI-driven patient history summarization.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Solutions</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Emergency Care
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Patient History
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      AI Analysis
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Support</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Guides
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Company</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Legal</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-base text-muted-foreground hover:text-foreground">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-muted pt-8">
          <p className="text-base text-muted-foreground xl:text-center">
            &copy; 2023 MedSnap, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}