"use client";

import Link from "next/link";
import {
  type ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  SidebarContent as SidebarContentPrimitive,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  type SidebarNavChild,
  type SidebarNavItem,
  sidebarNavigation,
} from "@/navigation/sidebar";

function matchesPathname(
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
  href: string
) {
  const [rawPath, rawQuery] = href.split("?");
  const path = rawPath || href;

  const baseMatch =
    pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));

  if (path === "/epg") {
    if (
      !(
        pathname.startsWith("/epg") &&
        pathname !== "/epg/today" &&
        pathname !== "/epg/tomorrow"
      )
    ) {
      return false;
    }
  } else if (!baseMatch) {
    return false;
  }

  if (!rawQuery) {
    return path === "/epg" ? true : baseMatch;
  }

  const targetParams = new URLSearchParams(rawQuery);

  for (const [key, value] of targetParams.entries()) {
    if (searchParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}

function isItemActive(
  item: SidebarNavItem,
  pathname: string,
  searchParams: ReadonlyURLSearchParams
) {
  if (matchesPathname(pathname, searchParams, item.href)) {
    return true;
  }

  return item.children?.some((child) =>
    matchesPathname(pathname, searchParams, child.href)
  );
}

function isChildActive(
  child: SidebarNavChild,
  pathname: string,
  searchParams: ReadonlyURLSearchParams
) {
  return matchesPathname(pathname, searchParams, child.href);
}

export default function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarContentPrimitive>
      {sidebarNavigation.map((group, groupIndex) => (
        <SidebarGroup key={group.label ?? groupIndex}>
          {group.label ? (
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const active = isItemActive(item, pathname, searchParams);

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={isCollapsed ? item.label : undefined}
                    >
                      <Link
                        aria-current={active ? "page" : undefined}
                        href={item.href}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.children && item.children.length > 0 ? (
                      <SidebarMenuSub>
                        {item.children.map((child) => {
                          const childActive = isChildActive(
                            child,
                            pathname,
                            searchParams
                          );
                          return (
                            <SidebarMenuSubItem key={child.label}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={childActive}
                                size="sm"
                              >
                                <Link
                                  aria-current={
                                    childActive ? "page" : undefined
                                  }
                                  href={child.href}
                                >
                                  {child.icon ? <child.icon /> : null}
                                  <span>{child.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContentPrimitive>
  );
}
