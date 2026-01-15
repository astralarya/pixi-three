import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { type ReactNode } from "react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "#components/ui/navigation-menu";

type NavLink = {
  label: string;
  description?: ReactNode;
  render?: ReactNode;
} & ({ href: string } | { to: string });

const NAV_LINKS = {
  Home: {
    label: "PixiThree",
    to: "/",
    render: (
      <p className="text-lg">
        <span className="text-pixi-red font-bold">Pixi</span>
        <span className="text-three-blue font-bold">Three</span>
      </p>
    ),
  },
  Docs: { label: "Docs", href: "/pixi-three/docs/" },
  GitHub: {
    label: "GitHub",
    href: "https://github.com/astralarium/pixi-three",
  },
} as const satisfies Record<string, NavLink>;

const EXAMPLE_LINKS = [
  {
    label: "Basic Scene",
    to: "/example/basic-scene",
    description: (
      <>
        <span className="text-pixi-red font-bold">Pixi</span>
        {" + "}
        <span className="text-three-blue font-bold">Three</span> integration.
      </>
    ),
  },
  {
    label: "On-Demand Rendering",
    to: "/example/demand-rendering",
    description: "Save power on mobile devices",
  },
  {
    label: "Unmount Context",
    to: "/example/unmount-context",
    description: "Unmount the <RenderContext>",
  },
] as const satisfies readonly NavLink[];

export function Navigation() {
  return (
    <NavigationMenu className="w-full max-w-full justify-between">
      <NavigationMenuList className="flex-none">
        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={<Link to={NAV_LINKS.Home.to}>{NAV_LINKS.Home.render}</Link>}
          ></NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem className="max-sm:hidden">
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            href={NAV_LINKS.Docs.href}
          >
            {NAV_LINKS.Docs.label}
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem className="max-sm:hidden">
          <NavigationMenuTrigger>Examples</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-100 gap-3 p-4 md:w-125 md:grid-cols-2">
              {EXAMPLE_LINKS.map((example) => (
                <li key={example.to}>
                  <NavigationMenuLink
                    closeOnClick
                    render={
                      <Link to={example.to}>
                        <div className="text-sm font-medium">
                          {example.label}
                        </div>
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {example.description}
                        </p>
                      </Link>
                    }
                  ></NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>

      <div className="grow" />

      <NavigationMenuList className="flex-none max-sm:hidden">
        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            href={NAV_LINKS.GitHub.href}
          >
            {NAV_LINKS.GitHub.label}
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>

      <NavigationMenuList className="flex-none sm:hidden">
        <NavigationMenuItem className="flex flex-none">
          <NavigationMenuTrigger>
            <Menu className="h-5 w-5" />
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-48 gap-1 p-2">
              <li>
                <NavigationMenuLink
                  closeOnClick
                  className="block px-3 py-2 text-sm"
                  href={NAV_LINKS.Docs.href}
                >
                  {NAV_LINKS.Docs.label}
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink
                  closeOnClick
                  className="block px-3 py-2 text-sm"
                  href={NAV_LINKS.GitHub.href}
                >
                  {NAV_LINKS.GitHub.label}
                </NavigationMenuLink>
              </li>
              <li className="my-1 border-t" />
              <li className="text-muted-foreground px-3 py-1 text-xs font-semibold">
                Examples
              </li>
              {EXAMPLE_LINKS.map((example) => (
                <li key={example.to}>
                  <NavigationMenuLink
                    closeOnClick
                    className="block px-5 py-2 text-sm"
                    render={<Link to={example.to}>{example.label}</Link>}
                  ></NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
