'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookText,
  SpellCheck,
  FileSignature,
  FileText,
  Star,
  BotMessageSquare,
  FileType,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'অভিধান', icon: BookText },
  { href: '/spell-check', label: 'বানান পরীক্ষা', icon: SpellCheck },
  { href: '/grammar-check', label: 'ব্যাকরণ পরীক্ষা', icon: FileSignature },
  { href: '/advanced-correction', label: 'ডকুমেন্ট সংশোধন', icon: FileText },
  { href: '/document-convert', label: 'ডকুমেন্ট রূপান্তর', icon: FileType },
  { href: '/favorites', label: 'প্রিয় শব্দ', icon: Star },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentNavItem = navItems.find(item => item.href === pathname) || navItems[0];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border/60 pb-3">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="p-1.5 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <BotMessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-headline tracking-tight text-sidebar-foreground">
                BanglaVerse
              </h1>
              <p className="text-[11px] text-sidebar-foreground/70">বাংলা ভাষা প্ল্যাটফর্ম</p>
            </div>
            <SidebarTrigger className="ml-auto md:hidden" />
          </div>
        </SidebarHeader>

        <SidebarContent className="py-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} className="w-full">
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right' }}
                    className="font-medium"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/60 p-3">
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70 px-1">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>AI চালিত বাংলা ভাষা প্রযুক্তি</span>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top Header Bar for Mobile and Desktop */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border/80 bg-background/95 backdrop-blur px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-foreground hover:bg-muted" />
            <span className="font-headline font-semibold text-foreground text-sm sm:text-base">
              {currentNavItem.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">BanglaVerse v1.2</span>
          </div>
        </header>

        {/* Main Page Area */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
