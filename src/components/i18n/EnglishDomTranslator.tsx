"use client";

import { useEffect } from "react";
import { translateUiTextToEnglish } from "@/i18n/uiTextTranslations";
import { useLanguage } from "@/i18n/useLanguage";

const originalTextAttribute = "data-nestly-original-text";
const originalPlaceholderAttribute = "data-nestly-original-placeholder";
const originalAriaAttribute = "data-nestly-original-aria-label";

function isTextOnlyElement(element: Element) {
  const childNodes = Array.from(element.childNodes);
  return childNodes.length === 1 && childNodes[0]?.nodeType === Node.TEXT_NODE;
}

function translateTextElement(element: Element) {
  if (!isTextOnlyElement(element)) {
    return;
  }

  const original =
    element.getAttribute(originalTextAttribute) ?? element.textContent ?? "";
  const translated = translateUiTextToEnglish(original);

  if (!translated) {
    return;
  }

  if (!element.hasAttribute(originalTextAttribute)) {
    element.setAttribute(originalTextAttribute, original);
  }

  if (element.textContent === translated) {
    return;
  }

  element.textContent = translated;
}

function translateAttribute(
  element: Element,
  attributeName: "placeholder" | "aria-label",
  originalAttributeName: string
) {
  const attributeValue =
    element.getAttribute(originalAttributeName) ??
    element.getAttribute(attributeName) ??
    "";
  const translated = translateUiTextToEnglish(attributeValue);

  if (!translated) {
    return;
  }

  if (!element.hasAttribute(originalAttributeName)) {
    element.setAttribute(originalAttributeName, attributeValue);
  }

  if (element.getAttribute(attributeName) === translated) {
    return;
  }

  element.setAttribute(attributeName, translated);
}

function translateTree(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let currentNode: Node | null = walker.currentNode;

  while (currentNode) {
    if (currentNode instanceof Element) {
      translateTextElement(currentNode);
      translateAttribute(
        currentNode,
        "placeholder",
        originalPlaceholderAttribute
      );
      translateAttribute(currentNode, "aria-label", originalAriaAttribute);
    }

    currentNode = walker.nextNode();
  }
}

function restoreTree(root: ParentNode) {
  root
    .querySelectorAll(`[${originalTextAttribute}]`)
    .forEach((element) => {
      element.textContent = element.getAttribute(originalTextAttribute) ?? "";
      element.removeAttribute(originalTextAttribute);
    });

  root
    .querySelectorAll(`[${originalPlaceholderAttribute}]`)
    .forEach((element) => {
      element.setAttribute(
        "placeholder",
        element.getAttribute(originalPlaceholderAttribute) ?? ""
      );
      element.removeAttribute(originalPlaceholderAttribute);
    });

  root
    .querySelectorAll(`[${originalAriaAttribute}]`)
    .forEach((element) => {
      element.setAttribute(
        "aria-label",
        element.getAttribute(originalAriaAttribute) ?? ""
      );
      element.removeAttribute(originalAriaAttribute);
    });
}

export default function EnglishDomTranslator() {
  const { language } = useLanguage();

  useEffect(() => {
    const root = document.getElementById("main-content");

    if (!root) {
      return;
    }

    if (language !== "en") {
      restoreTree(root);
      return;
    }

    translateTree(root);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            translateTree(node);
          }
        });

        if (
          mutation.type === "characterData" &&
          mutation.target.parentElement
        ) {
          translateTextElement(mutation.target.parentElement);
        }
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}
