import { Link } from "@tanstack/react-router";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "#components/ui/navigation-menu";

export function Navigation() {
  return (
    <NavigationMenu className="w-full max-w-full justify-between">
      <NavigationMenuList className="flex-none">
        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={
              <Link to="/">
                <p className="text-lg">
                  <span className="text-pixi-red font-bold">Pixi</span>
                  <span className="text-three-blue font-bold">Three</span>
                </p>
              </Link>
            }
          ></NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            href="/pixi-three/docs/"
          >
            Docs
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Examples</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-100 gap-3 p-4 md:w-125 md:grid-cols-2">
              <li>
                <NavigationMenuLink
                  closeOnClick
                  render={
                    <Link to="/example/basic-scene">
                      <div className="text-sm font-medium">Basic Scene</div>
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        <span className="text-pixi-red font-bold">Pixi</span>
                        {" + "}
                        <span className="text-three-blue font-bold">
                          Three
                        </span>{" "}
                        integration.
                      </p>
                    </Link>
                  }
                ></NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink
                  closeOnClick
                  render={
                    <Link to="/example/demand-rendering">
                      <div className="text-sm font-medium">
                        On-Demand Rendering
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        Save power on mobile devices
                      </p>
                    </Link>
                  }
                ></NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink
                  closeOnClick
                  render={
                    <Link to="/example/unmount-context">
                      <div className="text-sm font-medium">Unmount Context</div>
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        Unmount the &lt;RenderContext&gt;
                      </p>
                    </Link>
                  }
                ></NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>

      <NavigationMenuList className="flex-none">
        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            href="https://github.com/astralarium/pixi-three"
          >
            GitHub
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
