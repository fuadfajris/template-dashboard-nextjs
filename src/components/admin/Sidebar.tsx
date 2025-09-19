"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  BoxIconLine,
  CalendarIcon,
  ChevronDownIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
} from "@/icons";
import { useUser } from "@/context/UserContext";
import { ScanQrCode } from "lucide-react";
// import {
//   BoxCubeIcon,
//   CalenderIcon,
//   GridIcon,
//   ListIcon,
//   PageIcon,
//   PieChartIcon,
//   PlugInIcon,
//   TableIcon,
//   UserCircleIcon,
// } from "../icons/index";
// import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; new?: boolean }[];
};

const navItems: NavItem[] = [
  // {
  //   icon: <GridIcon />,
  //   name: "Menu",
  //   subItems: [{ name: "Dashboard", path: "/dashboard" }],
  // },
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <CalendarIcon />,
    name: "Events",
    path: "/events",
  },
  {
    icon: <GroupIcon />,
    name: "Lineup",
    path: "/lineup",
  },
  {
    icon: <BoxIconLine />,
    name: "Order",
    path: "/order",
  },
  {
    icon: <ScanQrCode />,
    name: "Checkin",
    path: "/checkin",
  },
];

const othersItems: NavItem[] = [
  // {
  //   icon: null,
  //   name: "Charts",
  //   subItems: [
  //     { name: "Line Chart", path: "/line-chart" },
  //     { name: "Bar Chart", path: "/bar-chart" },
  //   ],
  // },
  // {
  //   icon: null,
  //   name: "UI Elements",
  //   subItems: [
  //     { name: "Alerts", path: "/alerts" },
  //     { name: "Avatar", path: "/avatars" },
  //     { name: "Badge", path: "/badge" },
  //     { name: "Buttons", path: "/buttons" },
  //     { name: "Images", path: "/images" },
  //     { name: "Videos", path: "/videos" },
  //   ],
  // },
];

const Sidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { user } = useUser();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={` relative flex items-center w-full gap-3 px-3 py-2 font-medium rounded-lg text-theme-sm group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "bg-blue-100 text-indigo-500 dark:bg-indigo-500/[0.12] dark:text-indigo-400"
                  : "text-gray-700 hover:bg-gray-100 group-hover:text-gray-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-300"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "text-indigo-500 dark:text-indigo-400"
                    : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-indigo-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`relative flex items-center w-full gap-3 px-3 py-2 font-medium rounded-lg text-theme-sm group ${
                  isActive(nav.path)
                    ? "bg-blue-100 text-indigo-500 dark:bg-indigo-500/[0.12] dark:text-indigo-400"
                    : "text-gray-700 hover:bg-gray-100 group-hover:text-gray-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-300"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "text-indigo-500 dark:text-indigo-400"
                      : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-theme-sm font-medium ${
                        isActive(subItem.path)
                          ? "bg-blue-100 text-indigo-500 dark:bg-indigo-500/[0.12] dark:text-indigo-400"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "bg-blue-200 dark:bg-indigo-500/20"
                                : "bg-blue-100 group-hover:bg-blue-200 dark:bg-indigo-500/15 dark:group-hover:bg-indigo-500/20"
                            } block rounded-full px-2.5 py-0.5 text-xs font-medium uppercase text-indigo-500 dark:text-indigo-400 `}
                          >
                            new
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
  const isActive = useCallback(
    (path: string) => pathname === path || pathname.startsWith(`${path}/`),
    [pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              {user?.logo && (
                <div className="flex items-center gap-2">
                  <Image
                    src={
                      user.logo
                        ? `/api/upload?file=${user.logo}`
                        : "/api/upload?file=/uploads/merchant/placeholder.png"
                    }
                    alt="Logo"
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                  <span className="font-bold text-lg text-black dark:text-white">
                    {user?.name}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {user?.logo && (
                <>
                  <Image
                    src={
                      user.logo
                        ? `/api/upload?file=${user.logo}`
                        : "/api/upload?file=/uploads/merchant/placeholder.png"
                    }
                    alt="Logo"
                    width={32}
                    height={32}
                  />
                  <span className="font-bold text-sm text-gray-800 dark:text-white/90">{user?.name}</span>
                </>
              )}
            </>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {othersItems.length > 0 && (
              <div className="">
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Others"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(othersItems, "others")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
