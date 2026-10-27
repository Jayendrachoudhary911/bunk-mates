// src/components/chats_components/FormattedMessageText.jsx
import React, { useState, useMemo } from "react";
import {
  Typography,
  Box,
  SwipeableDrawer,
  Button,
  Chip,
  Tooltip,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { isEmojiOnly } from "../../utils/chatHelpers";
import {
  drawerPaperSx,
  drawerBackdropSx,
  DrawerHandle,
} from "../../theme/designSystem";

/**
 * CodeBlock Component
 * Displays multi-line code blocks with a header, language indicator, and one-click copy button.
 */
const CodeBlock = ({ language, code, isDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy code to clipboard", err);
    }
  };

  return (
    <Box
      sx={{
        my: 1,
        borderRadius: "10px",
        overflow: "hidden",
        border: `1px solid ${
          isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"
        }`,
        bgcolor: isDark ? "rgba(12, 13, 18, 0.85)" : "rgba(244, 246, 249, 0.95)",
        boxShadow: isDark
          ? "0 4px 14px rgba(0, 0, 0, 0.3)"
          : "0 2px 8px rgba(0, 0, 0, 0.05)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 0.5,
          bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
          borderBottom: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"
          }`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: "0.72rem",
            color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {language || "code"}
        </Typography>
        <Button
          size="small"
          onClick={handleCopy}
          startIcon={
            copied ? (
              <CheckRoundedIcon sx={{ fontSize: "14px !important", color: "#4caf50" }} />
            ) : (
              <ContentCopyRoundedIcon sx={{ fontSize: "14px !important" }} />
            )
          }
          sx={{
            minWidth: 0,
            px: 1,
            py: 0.2,
            fontSize: "0.68rem",
            fontWeight: 600,
            textTransform: "none",
            color: copied
              ? "#4caf50"
              : isDark
              ? "rgba(255, 255, 255, 0.75)"
              : "rgba(0, 0, 0, 0.65)",
            "&:hover": {
              bgcolor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
            },
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.4,
          fontFamily: "'Fira Code', 'Roboto Mono', Consolas, monospace",
          fontSize: "0.82rem",
          lineHeight: 1.5,
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          color: isDark ? "#e2e8f0" : "#1e293b",
        }}
      >
        <code>{code}</code>
      </Box>
    </Box>
  );
};

/**
 * Token definitions for inline elements
 */
const PATTERNS = [
  // 1. Inline code: `...` or <code>...</code>
  {
    type: "inline_code",
    regex: /`([^`\n]+)`|<code>([\s\S]*?)<\/code>/i,
    extract: (m) => m[1] ?? m[2],
  },
  // 2. Protocol URLs: http:// or https://
  {
    type: "url_protocol",
    regex: /https?:\/\/[^\s<]+/i,
    extract: (m) => m[0],
  },
  // 3. Bare domains: www.example.com or example.com/path
  {
    type: "url_domain",
    regex: /\b(?:www\.)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s<]*)?|\b[a-zA-Z0-9-]+\.(?:com|org|net|edu|gov|io|app|co|in|ai|me|info|biz|uk|ca|de|jp|fr|au|us|tech|dev|xyz|travel|online|store|live)(?:\/[^\s<]*)?/i,
    extract: (m) => m[0],
  },
  // 4. Mentions: @username
  {
    type: "mention",
    regex: /(?:^|[\s(])(@[a-zA-Z0-9_.-]+)/,
    extract: (m) => m[1],
    prefixLen: (m) => m[0].indexOf(m[1]),
  },
  // 5. Slash commands: /command
  {
    type: "command",
    regex: /(?:^|[\s(])(\/[a-zA-Z0-9_-]+)/,
    extract: (m) => m[1],
    prefixLen: (m) => m[0].indexOf(m[1]),
  },
  // 6. HTML Bold: <b>...</b> or <strong>...</strong>
  {
    type: "bold",
    regex: /<(?:b|strong)>([\s\S]*?)<\/(?:b|strong)>/i,
    extract: (m) => m[1],
  },
  // 7. HTML Italic: <i>...</i> or <em>...</em>
  {
    type: "italic",
    regex: /<(?:i|em)>([\s\S]*?)<\/(?:i|em)>/i,
    extract: (m) => m[1],
  },
  // 8. HTML Underline: <u>...</u>
  {
    type: "underline",
    regex: /<u>([\s\S]*?)<\/u>/i,
    extract: (m) => m[1],
  },
  // 9. HTML Strikethrough: <s>, <del>, <strike>
  {
    type: "strikethrough",
    regex: /<(?:s|del|strike)>([\s\S]*?)<\/(?:s|del|strike)>/i,
    extract: (m) => m[1],
  },
  // 10. Markdown Bold: **...**
  {
    type: "bold",
    regex: /\*\*([^*\n]+?)\*\*/,
    extract: (m) => m[1],
  },
  // 11. Markdown / Discord Underline: __...__
  {
    type: "underline",
    regex: /__([^_\n]+?)__/,
    extract: (m) => m[1],
  },
  // 12. Markdown Strikethrough: ~~...~~
  {
    type: "strikethrough",
    regex: /~~([^~\n]+?)~~/,
    extract: (m) => m[1],
  },
  // 13. WhatsApp Single Asterisk Bold: *text* (bounded by start/space/punctuation)
  {
    type: "bold",
    regex: /(?:^|[\s([{<"'`])(\*[^*\s\n](?:[^*\n]*?[^*\s\n])?\*)(?=[\s)\]}>"'`.,!?;:]|$)/,
    extract: (m) => m[1].slice(1, -1),
    prefixLen: (m) => m[0].indexOf(m[1]),
  },
  // 14. WhatsApp Single Underscore Italic: _text_ (bounded, not within snake_case)
  {
    type: "italic",
    regex: /(?:^|[\s([{<"'`])(_[^_\s\n](?:[^_\n]*?[^_\s\n])?_)(?=[\s)\]}>"'`.,!?;:]|$)/,
    extract: (m) => m[1].slice(1, -1),
    prefixLen: (m) => m[0].indexOf(m[1]),
  },
  // 15. WhatsApp Single Tilde Strikethrough: ~text~
  {
    type: "strikethrough",
    regex: /(?:^|[\s([{<"'`])(~[^~\s\n](?:[^~\n]*?[^~\s\n])?~)(?=[\s)\]}>"'`.,!?;:]|$)/,
    extract: (m) => m[1].slice(1, -1),
    prefixLen: (m) => m[0].indexOf(m[1]),
  },
];

/**
 * Recursively parses and renders inline rich text elements (bold, italic, underline, strikethrough, links, mentions).
 */
const renderRichInline = (text, isDark, onLinkClick, depth = 0, keyPrefix = "rich") => {
  if (!text || typeof text !== "string") return null;
  if (depth > 6) return text; // recursion guard

  const elements = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    let earliestMatch = null;
    let earliestPattern = null;
    let earliestIndex = Infinity;

    for (const pattern of PATTERNS) {
      const match = pattern.regex.exec(remaining);
      if (match) {
        const offset = pattern.prefixLen ? pattern.prefixLen(match) : 0;
        const actualIndex = match.index + offset;
        if (actualIndex < earliestIndex) {
          earliestIndex = actualIndex;
          earliestMatch = match;
          earliestPattern = pattern;
        }
      }
    }

    // No matches found, push rest as plain text
    if (!earliestMatch || earliestIndex === Infinity) {
      elements.push(remaining);
      break;
    }

    // Push any text preceding the match
    if (earliestIndex > 0) {
      elements.push(remaining.slice(0, earliestIndex));
    }

    const key = `${keyPrefix}_${depth}_${keyIndex++}`;
    const tokenType = earliestPattern.type;
    const extractedContent = earliestPattern.extract(earliestMatch);

    // Calculate how many characters were consumed from `remaining`
    const prefixOffset = earliestPattern.prefixLen ? earliestPattern.prefixLen(earliestMatch) : 0;
    const fullMatchStr = earliestMatch[0];
    const consumedLength = prefixOffset + (earliestPattern.prefixLen ? earliestMatch[1].length : fullMatchStr.length);

    switch (tokenType) {
      case "inline_code":
        elements.push(
          <Box
            key={key}
            component="code"
            sx={{
              fontFamily: "'Fira Code', 'Roboto Mono', Consolas, monospace",
              fontSize: "0.86em",
              bgcolor: isDark
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(0, 0, 0, 0.08)",
              color: isDark ? "#ff80ab" : "#c2185b",
              px: 0.6,
              py: 0.15,
              borderRadius: "5px",
              border: `1px solid ${
                isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"
              }`,
              verticalAlign: "baseline",
              wordBreak: "break-word",
            }}
          >
            {extractedContent}
          </Box>
        );
        break;

      case "url_protocol":
      case "url_domain": {
        const isSecure = extractedContent.toLowerCase().startsWith("https://");
        const fullUrl =
          extractedContent.toLowerCase().startsWith("http://") ||
          extractedContent.toLowerCase().startsWith("https://")
            ? extractedContent
            : `http://${extractedContent}`;

        elements.push(
          <Box
            key={key}
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.4,
              verticalAlign: "baseline",
            }}
          >
            <Box
              component="a"
              href={isSecure ? fullUrl : "#"}
              onClick={(e) => onLinkClick(e, { url: fullUrl, isSecure })}
              target={isSecure ? "_blank" : undefined}
              rel={isSecure ? "noopener noreferrer" : undefined}
              sx={{
                color: isSecure
                  ? isDark
                    ? "#00e5ff"
                    : "#0288d1"
                  : "#ff9100",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                fontWeight: 600,
                cursor: "pointer",
                wordBreak: "break-all",
                transition: "opacity 0.15s ease",
                "&:hover": {
                  opacity: 0.85,
                },
              }}
            >
              {extractedContent}
            </Box>

            {!isSecure && (
              <Tooltip
                title="Not Secure website (No HTTPS). Click with caution."
                arrow
              >
                <Chip
                  size="small"
                  icon={
                    <WarningAmberRoundedIcon
                      sx={{
                        fontSize: "13px !important",
                        color: "#ff4d4d !important",
                      }}
                    />
                  }
                  label="Not Secure"
                  onClick={(e) => onLinkClick(e, { url: fullUrl, isSecure })}
                  sx={{
                    height: 18,
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    bgcolor: "rgba(255, 77, 77, 0.16)",
                    color: "#ff4d4d",
                    border: "1px solid rgba(255, 77, 77, 0.35)",
                    cursor: "pointer",
                    "& .MuiChip-label": { px: 0.5 },
                    verticalAlign: "middle",
                    ml: 0.2,
                  }}
                />
              </Tooltip>
            )}
          </Box>
        );
        break;
      }

      case "mention":
        elements.push(
          <Box
            key={key}
            component="span"
            sx={{
              display: "inline-block",
              color: isDark ? "#00b7ff" : "#0288d1",
              bgcolor: isDark
                ? "rgba(0, 183, 255, 0.16)"
                : "rgba(2, 136, 209, 0.12)",
              border: `1px solid ${
                isDark ? "rgba(0, 183, 255, 0.3)" : "rgba(2, 136, 209, 0.25)"
              }`,
              fontWeight: 700,
              px: 0.7,
              py: 0.1,
              borderRadius: "6px",
              mx: 0.2,
              fontSize: "0.88rem",
              letterSpacing: 0.2,
            }}
          >
            {extractedContent}
          </Box>
        );
        break;

      case "command":
        elements.push(
          <Box
            key={key}
            component="span"
            sx={{
              display: "inline-block",
              fontFamily: "monospace",
              color: isDark ? "#ff4081" : "#c2185b",
              bgcolor: isDark
                ? "rgba(255, 64, 129, 0.16)"
                : "rgba(194, 24, 91, 0.12)",
              border: `1px solid ${
                isDark ? "rgba(255, 64, 129, 0.3)" : "rgba(194, 24, 91, 0.25)"
              }`,
              fontWeight: 700,
              px: 0.7,
              py: 0.1,
              borderRadius: "6px",
              mx: 0.2,
              fontSize: "0.85rem",
            }}
          >
            {extractedContent}
          </Box>
        );
        break;

      case "bold":
        elements.push(
          <Box
            key={key}
            component="span"
            sx={{ fontWeight: 700 }}
          >
            {renderRichInline(extractedContent, isDark, onLinkClick, depth + 1, `${key}_b`)}
          </Box>
        );
        break;

      case "italic":
        elements.push(
          <Box
            key={key}
            component="span"
            sx={{ fontStyle: "italic" }}
          >
            {renderRichInline(extractedContent, isDark, onLinkClick, depth + 1, `${key}_i`)}
          </Box>
        );
        break;

      case "underline":
        elements.push(
          <Box
            key={key}
            component="span"
            sx={{
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            {renderRichInline(extractedContent, isDark, onLinkClick, depth + 1, `${key}_u`)}
          </Box>
        );
        break;

      case "strikethrough":
        elements.push(
          <Box
            key={key}
            component="span"
            sx={{
              textDecoration: "line-through",
              opacity: 0.85,
            }}
          >
            {renderRichInline(extractedContent, isDark, onLinkClick, depth + 1, `${key}_s`)}
          </Box>
        );
        break;

      default:
        elements.push(extractedContent);
        break;
    }

    remaining = remaining.slice(earliestIndex + (consumedLength - prefixOffset));
  }

  return elements;
};

/**
 * Parses block quotes (> quote), markdown headers (#, ##, ###), bullet lists, and lines
 */
const renderBlocksAndQuotes = (text, isDark, onLinkClick, blockKey = "blk") => {
  if (!text || typeof text !== "string") return null;

  // Decode common HTML entities safely
  const decodedText = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  const lines = decodedText.split("\n");
  const result = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trimStart();
    const isQuote = trimmed.startsWith("> ");
    const isH1 = trimmed.startsWith("# ");
    const isH2 = trimmed.startsWith("## ");
    const isH3 = trimmed.startsWith("### ");
    const bulletMatch = trimmed.match(/^([-*•])\s+(.+)$/);
    const numListMatch = trimmed.match(/^(\d+[.)])\s+(.+)$/);

    if (isQuote) {
      const quoteContent = line.replace(/^\s*>\s*/, "");
      result.push(
        <Box
          key={`${blockKey}_q_${idx}`}
          component="blockquote"
          sx={{
            m: 0,
            my: 0.5,
            pl: 1.4,
            py: 0.3,
            borderLeft: "3.5px solid",
            borderColor: isDark ? "#00b7ff" : "#1976d2",
            bgcolor: isDark
              ? "rgba(0, 183, 255, 0.08)"
              : "rgba(25, 118, 210, 0.06)",
            borderRadius: "0 6px 6px 0",
            fontStyle: "italic",
            opacity: 0.95,
          }}
        >
          {renderRichInline(quoteContent, isDark, onLinkClick, 0, `${blockKey}_qline_${idx}`)}
        </Box>
      );
    } else if (isH1) {
      const content = trimmed.replace(/^#\s+/, "");
      result.push(
        <Typography
          key={`${blockKey}_h1_${idx}`}
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: "1.2rem",
            mt: idx > 0 ? 0.8 : 0,
            mb: 0.4,
            color: "inherit",
          }}
        >
          {renderRichInline(content, isDark, onLinkClick, 0, `${blockKey}_h1_${idx}`)}
        </Typography>
      );
    } else if (isH2) {
      const content = trimmed.replace(/^##\s+/, "");
      result.push(
        <Typography
          key={`${blockKey}_h2_${idx}`}
          variant="subtitle1"
          sx={{
            fontWeight: 750,
            fontSize: "1.08rem",
            mt: idx > 0 ? 0.6 : 0,
            mb: 0.3,
            color: "inherit",
          }}
        >
          {renderRichInline(content, isDark, onLinkClick, 0, `${blockKey}_h2_${idx}`)}
        </Typography>
      );
    } else if (isH3) {
      const content = trimmed.replace(/^###\s+/, "");
      result.push(
        <Typography
          key={`${blockKey}_h3_${idx}`}
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            fontSize: "0.98rem",
            mt: idx > 0 ? 0.4 : 0,
            mb: 0.2,
            color: "inherit",
          }}
        >
          {renderRichInline(content, isDark, onLinkClick, 0, `${blockKey}_h3_${idx}`)}
        </Typography>
      );
    } else if (bulletMatch) {
      result.push(
        <Box
          key={`${blockKey}_bullet_${idx}`}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 0.8,
            pl: 1,
            my: 0.2,
          }}
        >
          <Box
            component="span"
            sx={{
              color: isDark ? "#00b7ff" : "#1976d2",
              fontSize: "1.1rem",
              lineHeight: 1.3,
            }}
          >
            •
          </Box>
          <Box component="span" sx={{ flex: 1 }}>
            {renderRichInline(bulletMatch[2], isDark, onLinkClick, 0, `${blockKey}_bline_${idx}`)}
          </Box>
        </Box>
      );
    } else if (numListMatch) {
      result.push(
        <Box
          key={`${blockKey}_num_${idx}`}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 0.8,
            pl: 1,
            my: 0.2,
          }}
        >
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              fontSize: "0.85rem",
              minWidth: 18,
              color: isDark ? "#00b7ff" : "#1976d2",
            }}
          >
            {numListMatch[1]}
          </Box>
          <Box component="span" sx={{ flex: 1 }}>
            {renderRichInline(numListMatch[2], isDark, onLinkClick, 0, `${blockKey}_nline_${idx}`)}
          </Box>
        </Box>
      );
    } else {
      result.push(
        <React.Fragment key={`${blockKey}_l_${idx}`}>
          {renderRichInline(line, isDark, onLinkClick, 0, `${blockKey}_line_${idx}`)}
          {idx < lines.length - 1 && "\n"}
        </React.Fragment>
      );
    }
  }

  return result;
};

/**
 * Backward compatibility parser for external modules
 */
export const parseMessageTokens = (text) => {
  if (!text || typeof text !== "string") return [];
  return [{ type: "text", value: text }];
};

/**
 * FormattedMessageText Component
 * Master formatter for chats and group chats supporting:
 * - Emoji-only messages with hero magnification
 * - Code blocks with copy buttons (```lang\ncode\n```)
 * - Inline code (`code` or <code>code</code>)
 * - Blockquotes (> quote)
 * - Bold (**bold**, *bold*, <b>, <strong>)
 * - Italic (_italic_, <i>, <em>)
 * - Underline (__underline__, <u>)
 * - Strikethrough (~~strike~~, ~strike~, <s>, <del>, <strike>)
 * - Full gaps, multiple spaces, and linebreaks preservation (white-space: pre-wrap)
 * - Secure HTTPS links and insecure HTTP confirmation modal
 * - User mentions (@user) and slash commands (/command)
 */
const FormattedMessageText = ({
  text,
  isDark = true,
  hasImages = false,
  isOwn = false,
}) => {
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState("");

  const handleLinkClick = (e, { url, isSecure }) => {
    if (!isSecure) {
      e.preventDefault();
      setPendingUrl(url);
      setWarningModalOpen(true);
    }
  };

  const handleConfirmInsecureNavigation = () => {
    if (pendingUrl) {
      window.open(pendingUrl, "_blank", "noopener,noreferrer");
    }
    setWarningModalOpen(false);
    setPendingUrl("");
  };

  // Safely extract string from text prop (handles objects, null, undefined)
  const safeText = useMemo(() => {
    if (!text) return "";
    if (typeof text === "string") return text;
    if (typeof text === "object") {
      if (typeof text.text === "string") return text.text;
      if (typeof text.content === "string") return text.content;
      return "";
    }
    return String(text);
  }, [text]);

  // 1. Emoji-only detection
  const isEmoji = useMemo(() => isEmojiOnly(safeText), [safeText]);

  // 2. Parse code blocks: ```lang\ncode```
  const parsedSections = useMemo(() => {
    if (!safeText) return [];
    const CODE_BLOCK_REGEX = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
    const sections = [];
    let lastIndex = 0;
    let match;

    while ((match = CODE_BLOCK_REGEX.exec(safeText)) !== null) {
      if (match.index > lastIndex) {
        sections.push({
          type: "text",
          content: safeText.slice(lastIndex, match.index),
        });
      }
      sections.push({
        type: "code_block",
        language: match[1],
        code: match[2],
      });
      lastIndex = CODE_BLOCK_REGEX.lastIndex;
    }

    if (lastIndex < safeText.length) {
      sections.push({
        type: "text",
        content: safeText.slice(lastIndex),
      });
    }

    return sections;
  }, [safeText]);

  if (!safeText) return null;

  if (isEmoji) {
    return (
      <Typography
        variant="body1"
        sx={{
          fontSize: safeText.trim().length <= 4 ? "2.8rem" : "2rem",
          lineHeight: 1.2,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
          userSelect: "none",
        }}
      >
        {safeText}
      </Typography>
    );
  }

  return (
    <>
      <Typography
        component="div"
        variant="body1"
        sx={{
          fontSize: "0.94rem",
          lineHeight: 1.55,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
          px: hasImages ? 1 : 0,
          pt: hasImages ? 0.6 : 0,
          color: "inherit",
        }}
      >
        {parsedSections.map((sec, secIdx) => {
          if (sec.type === "code_block") {
            return (
              <CodeBlock
                key={`code_${secIdx}`}
                language={sec.language}
                code={sec.code}
                isDark={isDark}
              />
            );
          }
          return renderBlocksAndQuotes(sec.content, isDark, handleLinkClick, `sec_${secIdx}`);
        })}
      </Typography>

      {/* Insecure Link Confirmation Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        onOpen={() => {}}
        disableSwipeToOpen={false}
        ModalProps={{ BackdropProps: { sx: drawerBackdropSx } }}
        PaperProps={{
          sx: {
            ...drawerPaperSx(isDark ? "dark" : "light", { maxHeight: "85vh" }),
            overflowY: "auto",
          },
        }}
      >
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <DrawerHandle mode={isDark ? "dark" : "light"} />
        </Box>
        <Box sx={{ maxWidth: 460, mx: "auto", width: "100%", boxSizing: "border-box", pt: { xs: 1, md: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1, px: 2 }}>
            <WarningAmberRoundedIcon sx={{ color: "#ff9800", fontSize: 26 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
              Security Notice: Insecure Website
            </Typography>
          </Box>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              sx={{
                color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)",
                fontSize: "0.9rem",
                lineHeight: 1.5,
                mb: 1.5,
              }}
            >
              This link does not use a secure HTTPS connection. Information you share on this site may be visible to others.
            </Typography>
            <Box
              sx={{
                p: 1.2,
                borderRadius: "10px",
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: "1px solid rgba(255, 152, 0, 0.25)",
                wordBreak: "break-all",
                fontFamily: "monospace",
                fontSize: "0.82rem",
                color: "#ff9800",
              }}
            >
              {pendingUrl}
            </Box>
          </Box>
          <Box sx={{ px: 2, pb: 2, pt: 1, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              onClick={() => setWarningModalOpen(false)}
              sx={{ textTransform: "none", color: "inherit", opacity: 0.7 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmInsecureNavigation}
              endIcon={<OpenInNewRoundedIcon />}
              sx={{
                borderRadius: "10px",
                bgcolor: "#ff9800",
                color: "#000",
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { bgcolor: "#f57c00" },
              }}
            >
              Open Anyway
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
};

export default React.memo(FormattedMessageText);
