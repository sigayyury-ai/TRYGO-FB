// Sidebar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  CheckCircle,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Package,
  Palette,
  Rocket,
  User,
  MessageCircle,
  Sparkles,
  Lock,
} from "lucide-react";
import { useSeoAgentEnabled } from "@/config/featureFlags";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { pathname } = useLocation();
  const seoAgentEnabled = useSeoAgentEnabled();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="w-64 bg-white border-r px-4 py-6 ">
      <div className="flex flex-col">
        <h2 className="text-gray-400 text-xs px-2">Understand</h2>

        <div className="flex flex-col gap-1">
          <Link
            id="core-header"
            to="/dashboard"
            onClick={onNavigate}
            className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
          ${
            isActive("/dashboard")
              ? "bg-blue-100 text-gray-900" // активна сторінка
              : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
          }`}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Core
          </Link>
          <Link
            id="icp-header"
            to="/person"
            onClick={onNavigate}
            className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
          ${
            isActive("/person")
              ? "bg-blue-100 text-gray-900"
              : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
          }`}
          >
            <User className="h-4 w-4 mr-2" />
            ICP
          </Link>
        </div>
      </div>

      <div className="flex flex-col">
        <h2 className="text-gray-400 text-xs mt-6 px-2">Define</h2>
        <div className="flex flex-col gap-1">
          <Link
            id="research-header"
            to="/research"
            onClick={onNavigate}
            className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
          ${
            isActive("/research")
              ? "bg-blue-100 text-gray-900"
              : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
          }`}
          >
            <User className="h-4 w-4 mr-2" />
            Research
          </Link>
          <Link
            id="validation-header"
            to="/validation"
            onClick={onNavigate}
            className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
          ${
            isActive("/validation")
              ? "bg-blue-100 text-gray-900"
              : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
          }`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Validation
          </Link>
        </div>
      </div>
      <div className="flex flex-col">
        <h2 className="text-gray-400 text-xs mt-6 px-2">Prototype</h2>
        <div className="flex flex-col gap-1">
          <Link
            to="/packing"
            onClick={onNavigate}
            className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
          ${
            isActive("/packing")
              ? "bg-blue-100 text-gray-900"
              : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
          }`}
          >
            <Package className="h-4 w-4 mr-2" />
            Packing
          </Link>
          <Link
            to="/branding"
            onClick={onNavigate}
            className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
          ${
            isActive("/branding")
              ? "bg-blue-100 text-gray-900"
              : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
          }`}
          >
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </Link>
        </div>
      </div>
      <div className="flex flex-col">
        <h2 className="text-gray-400 text-xs mt-6 px-2">Deliver</h2>

        <div className="flex flex-col gap-1">
          <Link
            id="gtm-header"
            to="/gtm"
            onClick={onNavigate}
            className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
          ${
            isActive("/gtm")
              ? "bg-blue-100 text-gray-900"
              : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
          }`}
          >
            <Rocket className="h-4 w-4 mr-2" />
            GTM
          </Link>
          <Link
            to="/materials"
            onClick={onNavigate}
            className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
          ${
            isActive("/materials")
              ? "bg-blue-100 text-gray-900"
              : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
          }`}
          >
            <FileText className="h-4 w-4 mr-2" />
            Pitch Materials
          </Link>
          {seoAgentEnabled ? (
            <Link
              to="/seo-agent"
              onClick={onNavigate}
              className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
            ${
              isActive("/seo-agent")
                ? "bg-blue-100 text-gray-900"
                : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
            }`}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              SEO Agent
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center w-full rounded-md px-2 py-2 text-gray-400 cursor-not-allowed opacity-50">
                  <Lock className="h-4 w-4 mr-2" />
                  SEO Agent
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>SEO Agent недоступен</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      
      <div className="flex flex-col mt-auto pt-6 border-t">
        <Link
          to="/features"
          onClick={onNavigate}
          className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
        ${
          isActive("/features")
            ? "bg-blue-100 text-gray-900"
            : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
        }`}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Features & Bugs
        </Link>
        <a
          href="https://discord.gg/KrWd3Cx6vK"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center w-full rounded-md px-2 py-2 transition-colors text-gray-700 hover:bg-blue-100 hover:text-gray-900"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Support
        </a>
      </div>
    </nav>
  );
};
