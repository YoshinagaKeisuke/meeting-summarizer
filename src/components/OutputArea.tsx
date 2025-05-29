import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

/**
 * OutputAreaコンポーネントのプロパティ
 */
interface OutputAreaProps {
  /** 表示・編集するMarkdown内容 */
  markdownContent: string;
  /** Markdown内容変更時のコールバック関数 */
  onMarkdownChange: (newContent: string) => void;
}

/** 表示モードの型定義（編集モードまたはプレビューモード） */
type ViewMode = 'edit' | 'preview';

/**
 * 思考ブロックのインターフェース
 */
interface ThinkBlock {
  id: string;
  content: string;
}

/**
 * 生成された議事録を表示・編集するためのコンポーネント
 *
 * @param props コンポーネントのプロパティ
 * @returns Reactコンポーネント
 */
const OutputArea: React.FC<OutputAreaProps> = ({
  markdownContent,
  onMarkdownChange,
}) => {
  /** 現在の表示モード（編集またはプレビュー） */
  const [viewMode, setViewMode] = useState<ViewMode>('preview'); // 初期表示はプレビュー

  // markdownContentが変更されたときに強制的に再レンダリングするためのキー
  const [renderKey, setRenderKey] = useState<number>(Date.now());

  // 思考ブロックの状態管理
  const [thinkBlocks, setThinkBlocks] = useState<ThinkBlock[]>([]);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});

  // 抽出されたMarkdown部分
  const [extractedMarkdown, setExtractedMarkdown] = useState<string>(markdownContent);

  // プレビューエリアへの参照
  const previewRef = useRef<HTMLDivElement>(null);

  // コピー状態管理
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  // markdownContentが変更されたときにrenderKeyを更新
  useEffect(() => {
    setRenderKey(Date.now());

    // 思考プロセスを抽出
    const { cleanedContent, blocks } = extractThinkBlocks(markdownContent);
    setThinkBlocks(blocks);

    // 初期状態では全ての思考ブロックを閉じておく
    const initialExpandState: Record<string, boolean> = {};
    blocks.forEach(block => {
      initialExpandState[block.id] = false;
    });
    setExpandedBlocks(initialExpandState);

    // Markdown部分を抽出
    const extracted = extractMarkdownContent(cleanedContent);
    setExtractedMarkdown(extracted);

  }, [markdownContent]);

  /**
   * <think>タグを抽出する関数
   * @param content Markdown内容
   * @returns 処理後のMarkdown内容と抽出された思考ブロック
   */
  const extractThinkBlocks = (content: string) => {
    // <think>タグを検出して処理
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    let match;
    const blocks: ThinkBlock[] = [];
    let cleanedContent = content;
    let index = 0;

    // 全ての<think>タグを検出
    while ((match = thinkRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const thinkContent = match[1];
      const blockId = `think-block-${index}`;

      // 思考ブロックを配列に追加
      blocks.push({
        id: blockId,
        content: thinkContent
      });

      // <think>タグを削除
      cleanedContent = cleanedContent.replace(fullMatch, '');

      index++;
    }

    return { cleanedContent, blocks };
  };

  /**
   * Markdown形式の部分のみを抽出する関数
   * @param content 処理対象のテキスト
   * @returns 抽出されたMarkdown部分
   */
  const extractMarkdownContent = (content: string): string => {
    if (!content) return '';

    const startTag = '```markdown';
    const startIndex = content.indexOf(startTag);

    if (startIndex !== -1) {
      // 開始タグの終わり位置（改行の次）を探す
      const afterStart = content.indexOf('\n', startIndex);
      if (afterStart !== -1) {
        // 最後の ```
        const endIndex = content.lastIndexOf('```');
        if (endIndex !== -1 && endIndex > afterStart) {
          content = content.slice(afterStart + 1, endIndex).trim();
        }
      }
    }



    // Markdownとして認識するパターン
    const markdownPatterns = [
      // 見出し
      /^#{1,6}\s+.+$/m,
      // リスト
      /^[\s]*[-*+]\s+.+$/m,
      /^[\s]*\d+\.\s+.+$/m,
      // コードブロック
      /^```[\s\S]*?```$/m,
      // 引用
      /^>\s+.+$/m,
      // テーブル
      /^\|.+\|$/m,
      // 水平線
      /^---+$/m,
      /^===+$/m,
      /^\*\*\*+$/m,
      // リンク
      /\[.+?\]\(.+?\)/,
      // 画像
      /!\[.+?\]\(.+?\)/,
      // 強調
      /\*\*.+?\*\*/,
      /__.+?__/,
      // 斜体
      /\*.+?\*/,
      /_.+?_/,
      // 取り消し線
      /~~.+?~~/,
      // インラインコード
      /`.+?`/
    ];

    // 明らかにMarkdownでない部分を検出するパターン
    const nonMarkdownPatterns = [
      // HTMLタグ（ただし<think>タグは除く）
      /<(?!\/?think)[a-zA-Z]+.*?>/,
      // JSONのような構造
      /^\s*\{\s*".*?"\s*:/m,
      // プログラミング言語の構文（ただしコードブロック内は除く）
      /^import\s+.+\s+from\s+['"].+['"];?$/m,
      /^const\s+.+\s+=\s+/m,
      /^function\s+.+\(.*\)\s*\{/m,
      /^class\s+.+\s+\{/m,
      // その他の非Markdown要素
      /^API Response:/m,
      /^Error:/m
    ];

    // 行ごとに処理
    const lines = content.split('\n');
    let result = '';
    let inCodeBlock = false;
    let inMarkdownSection = false;
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // コードブロック内かどうかの判定
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        currentSection += line + '\n';
        continue;
      }

      // コードブロック内なら無条件で追加
      if (inCodeBlock) {
        currentSection += line + '\n';
        continue;
      }

      // Markdownパターンに一致するか確認
      const isMarkdown = markdownPatterns.some(pattern => pattern.test(line));

      // 非Markdownパターンに一致するか確認
      const isNonMarkdown = nonMarkdownPatterns.some(pattern => pattern.test(line));

      // Markdownと判定された場合、またはMarkdownセクション内で空行の場合
      if (isMarkdown || (inMarkdownSection && line.trim() === '')) {
        inMarkdownSection = true;
        currentSection += line + '\n';
      }
      // 非Markdownと判定された場合
      else if (isNonMarkdown) {
        // 現在のMarkdownセクションがあれば結果に追加
        if (currentSection.trim()) {
          result += currentSection;
          currentSection = '';
        }
        inMarkdownSection = false;
      }
      // どちらでもない場合（通常のテキスト）
      else {
        // 前後の文脈からMarkdownかどうかを判断
        if (inMarkdownSection) {
          currentSection += line + '\n';
        } else {
          // 次の行がMarkdownっぽければ、このテキストもMarkdownとして扱う
          const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
          const nextIsMarkdown = markdownPatterns.some(pattern => pattern.test(nextLine));

          if (nextIsMarkdown) {
            inMarkdownSection = true;
            currentSection += line + '\n';
          }
        }
      }
    }

    // 最後のセクションを追加
    if (currentSection.trim()) {
      result += currentSection;
    }

    // 結果が空の場合は元のコンテンツを返す
    return result.trim() || content;
  };

  /**
   * 思考ブロックの表示/非表示を切り替える関数
   * @param blockId 思考ブロックのID
   */
  const toggleThinkBlock = (blockId: string) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  // 思考ブロックのレンダリング
  const renderThinkBlock = (block: ThinkBlock) => {
    const isExpanded = expandedBlocks[block.id];

    return (
      <div key={block.id} className="my-4 border-2 border-indigo-300 rounded-md bg-indigo-50 shadow-sm">
        <button
          onClick={() => toggleThinkBlock(block.id)}
          className="w-full flex items-center justify-between p-3 bg-indigo-100 hover:bg-indigo-200 transition-colors"
          aria-expanded={isExpanded}
        >
          <span className="font-medium text-indigo-800">思考プロセス</span>
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-indigo-600" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-indigo-600" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 border-t border-indigo-300 bg-indigo-50 text-left">
            <div className="prose prose-slate max-w-none text-left">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={customComponents}
              >
                {block.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Markdownレンダリングのためのカスタムコンポーネント
  const customComponents: Components = {
    // 見出しのスタイル強化
    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-left" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-left" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-left" {...props} />,
    h4: ({ node, ...props }) => <h4 className="text-base font-bold mt-3 mb-2 text-left" {...props} />,
    h5: ({ node, ...props }) => <h5 className="text-sm font-bold mt-3 mb-1 text-left" {...props} />,
    h6: ({ node, ...props }) => <h6 className="text-xs font-bold mt-3 mb-1 text-left" {...props} />,

    // リストのスタイル強化
    ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-3 text-left" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-3 text-left" {...props} />,
    li: ({ node, ...props }) => <li className="my-1 text-left" {...props} />,

    // 段落のスタイル
    p: ({ node, ...props }) => <p className="my-2 text-left" {...props} />,

    // その他の要素
    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-left" {...props} />,

    // コードブロックとインラインコード
    code: ({ node, className, children, ...props }) => {
      // 通常のコードブロック
      const isCodeBlock = /language-(\w+)/.test(className || '');
      if (isCodeBlock) {
        return (
          <pre className="bg-slate-800 p-4 rounded-md overflow-x-auto my-4 shadow-inner text-left">
            <code className={`font-mono text-sm text-white ${className || ''}`} {...props}>
              {children}
            </code>
          </pre>
        );
      }

      // インラインコード
      return (
        <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800" {...props}>
          {children}
        </code>
      );
    }
  };

  // コピー処理
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedMarkdown);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 1500);
    } catch (e) {
      setCopyStatus('idle');
      alert('コピーに失敗しました');
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            生成された議事録
          </h2>
          <button
            onClick={handleCopy}
            className="py-2 px-4 rounded font-medium text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors ml-2"
            disabled={!extractedMarkdown}
            style={{ minWidth: '110px' }}
          >
            {copyStatus === 'copied' ? 'コピーしました！' : 'コピー'}
          </button>
        </div>
        {/* 表示モード切り替えボタン */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('edit')}
            className={`py-2 px-4 rounded font-medium text-sm
                        ${viewMode === 'edit'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            編集
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`py-2 px-4 rounded font-medium text-sm
                        ${viewMode === 'preview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            プレビュー
          </button>
        </div>
      </div>

      {/* 編集モード */}
      {viewMode === 'edit' && (
        <div>
          <h3 className="text-md font-medium mb-1 sr-only">Markdownソース (編集可能)</h3>
          <textarea
            value={markdownContent}
            onChange={(e) => onMarkdownChange(e.target.value)}
            className="w-full h-[60vh] p-3 border border-gray-300 rounded-md resize-y font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="ここにMarkdownが出力されます..."
            aria-label="Markdownソース編集エリア"
          />
        </div>
      )}

      {/* プレビューモード */}
      {viewMode === 'preview' && (
        <div>
          <h3 className="text-md font-medium mb-1 sr-only">プレビュー</h3>

          {/* 思考プロセスブロック - プレビューエリアの外側（上部）に表示 */}
          {thinkBlocks.length > 0 && (
            <div className="mb-4">
              {thinkBlocks.map(block => renderThinkBlock(block))}
            </div>
          )}

          {/* Markdownプレビュー表示 */}
          <div
            ref={previewRef}
            className="w-full h-[60vh] p-6 border border-gray-300 rounded-md overflow-y-auto bg-gray-50 text-left"
            aria-label="Markdownプレビューエリア"
          >
            {markdownContent ? (
              <article className="prose prose-slate max-w-none text-left">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={customComponents}
                  key={`markdown-preview-${renderKey}`} // 強制的に再レンダリングするためのキー
                >
                  {extractedMarkdown}
                </ReactMarkdown>
              </article>
            ) : (
              <p className="text-gray-500 italic">プレビューするコンテンツがありません。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputArea;
