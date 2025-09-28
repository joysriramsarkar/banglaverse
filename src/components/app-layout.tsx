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
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookText, SpellCheck, FileSignature, FileText, Star, BotMessageSquare } from 'lucide-react';

const navItems = [
  { href: '/', label: 'অভিধান', icon: BookText },
  { href: '/spell-check', label: 'বানান পরীক্ষা', icon: SpellCheck },
  { href: '/grammar-check', label: 'ব্যাকরণ পরীক্ষা', icon: FileSignature },
  { href: '/advanced-correction', label: 'ডকুমেন্ট সংশোধন', icon: FileText },
  { href: '/favorites', label: 'প্রিয় শব্দ', icon: Star },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <BotMessageSquare className="w-8 h-8 text-sidebar-primary" />
            <h1 className="text-2xl font-bold font-headline text-sidebar-primary">BanglaVerse</h1>
            <SidebarTrigger className="ml-auto" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    as="a"
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right' }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
