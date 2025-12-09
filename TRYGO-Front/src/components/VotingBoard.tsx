import { useId, useEffect } from "react";

interface VotingBoardProps {
  slug?: string;
  colorMode?: "light" | "dark";
  userId?: string;
  userEmail?: string;
  userName?: string;
  imgUrl?: string;
  userSpend?: number;
  token?: string;
}

const VotingBoard = ({
  slug = "trygo",
  colorMode = "light",
  userId,
  userEmail,
  userName,
  imgUrl,
  userSpend = 0,
  token,
}: VotingBoardProps) => {
  const sessionKey = useId();
  const targetContainerId = `feature-requests-component-${sessionKey}`;

  useEffect(() => {
    // Create script element
    const script = document.createElement("script");
    script.src = `https://features.vote/widget/widget.js?sessionKey=${sessionKey}`;
    script.async = true;

    // Set custom attributes
    script.setAttribute("color_mode", colorMode);
    script.setAttribute("slug", slug);
    script.setAttribute("user_spend", userSpend.toString());

    if (userId) script.setAttribute("user_id", userId);
    if (userEmail) script.setAttribute("user_email", userEmail);
    if (userName) script.setAttribute("user_name", userName);
    if (imgUrl) script.setAttribute("img_url", imgUrl);
    if (token) script.setAttribute("token", token);

    // Handle script load
    script.onload = () => {
      // @ts-ignore
      if (window.loadVotingBoard) {
        // @ts-ignore
        window.loadVotingBoard(targetContainerId);
      }
    };

    // Append script to head
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [sessionKey, targetContainerId, colorMode, slug, userId, userEmail, userName, imgUrl, userSpend, token]);

  return <div id={targetContainerId} className="w-full" />;
};

export default VotingBoard;
