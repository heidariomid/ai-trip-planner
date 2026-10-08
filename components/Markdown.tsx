import type { ReactNode } from "react";
import { View } from "react-native";

import { Text } from "./Text";

export interface MarkdownProps {
  children: string;
}

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "numbered"; marker: string; text: string };

const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^[-*•]\s+(.*)$/;
const NUMBERED = /^(\d+)[.)]\s+(.*)$/;
const IMAGE = /!\[[^\]]*\]\([^)]*\)/g;
const LINK = /\[([^\]]+)\]\([^)]*\)/g;
const BARE_URL = /https?:\/\/\S+/g;
const BOLD = /(\*\*[^*]+\*\*|__[^_]+__)/g;

/** Links keep their words and lose their address. Images go entirely. */
function stripLinks(text: string): string {
  return text.replace(IMAGE, "").replace(LINK, "$1").replace(BARE_URL, "");
}

function toBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  function closeParagraph() {
    if (paragraph.length > 0) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  }

  for (const raw of stripLinks(source).split("\n")) {
    const line = raw.trim();
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);

    if (!line) {
      closeParagraph();
    } else if (heading) {
      closeParagraph();
      blocks.push({ type: "heading", text: heading[1] });
    } else if (bullet) {
      closeParagraph();
      blocks.push({ type: "bullet", text: bullet[1] });
    } else if (numbered) {
      closeParagraph();
      blocks.push({ type: "numbered", marker: `${numbered[1]}.`, text: numbered[2] });
    } else {
      paragraph.push(line);
    }
  }
  closeParagraph();

  return blocks;
}

/** Bold becomes the semibold face. The marks for italics and code are dropped. */
function renderInline(text: string): ReactNode[] {
  return text.split(BOLD).map((piece, index) => {
    const isBold = /^(\*\*|__)/.test(piece) && piece.length > 4;
    const plain = (isBold ? piece.slice(2, -2) : piece)
      // A reply still being written can end on a mark that has not closed yet.
      .replace(/\*\*|__/g, "")
      .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,!?:;]|$)/g, "$1$2")
      .replace(/`([^`]+)`/g, "$1");

    if (!plain) return null;
    return isBold ? (
      <Text key={index} className="font-semibold text-ink">
        {plain}
      </Text>
    ) : (
      plain
    );
  });
}

/**
 * The assistant's reply as formatted text: headings, bold, and lists, in the
 * app's own font. Hand-rolled, so it runs in Expo Go, a raw `**` or `#` never
 * shows, and a link or an image the model wrote is not rendered.
 */
export function Markdown({ children }: MarkdownProps) {
  const blocks = toBlocks(children);

  return (
    <View className="gap-2">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <Text key={index} className="mt-1 text-[16px] font-semibold leading-6 text-ink">
              {renderInline(block.text)}
            </Text>
          );
        }
        if (block.type === "paragraph") {
          return (
            <Text key={index} className="text-[15px] leading-[22px] text-ink">
              {renderInline(block.text)}
            </Text>
          );
        }
        return (
          <View key={index} className="flex-row">
            <Text className="w-5 text-[15px] leading-[22px] text-subtle">
              {block.type === "bullet" ? "•" : block.marker}
            </Text>
            <Text className="flex-1 text-[15px] leading-[22px] text-ink">
              {renderInline(block.text)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
