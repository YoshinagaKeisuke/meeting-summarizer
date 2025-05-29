/**
 * @file ExecutionArea.tsx
 * @description 議事録生成を実行するためのボタンを提供するコンポーネント
 *
 * このコンポーネントでは、ユーザーが議事録生成プロセスを開始するための
 * ボタンと、APIキー設定状態に関する通知を表示します。
 * 生成中はローディングアイコンを表示して処理状況を視覚的に伝えます。
 */

import React from 'react';

/**
 * ExecutionAreaコンポーネントのプロパティ
 */
interface ExecutionAreaProps {
  /** 議事録生成ボタンクリック時のコールバック関数 */
  onGenerateMinutes: () => void;
  /** 文字起こしデータダウンロードボタンクリック時のコールバック関数 */
  onDownloadTranscript: () => void;
  /** 議事録生成中かどうかを示すフラグ */
  isGenerating: boolean;
  /** APIエンドポイント（APIキー）が設定されているかを示すフラグ */
  isLlmEndpointSet: boolean;
  /** APIサーバーを使用するかどうかを示すフラグ */
  useApiServer: boolean;
  /** トランスクリプトが存在するかを示すフラグ (追加) */
  hasTranscript?: boolean;
  /** 議事録内容が存在するかを示すフラグ (追加) */
  hasMarkdownContent?: boolean;
  /** 議事録ダウンロードボタンクリック時のコールバック関数 (追加) */
  onDownloadMarkdown?: () => void;
}

/**
 * 回転するローディングアイコン（スピナー）コンポーネント
 *
 * @returns SVGアイコンコンポーネント
 */
const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

/**
 * 議事録生成を実行するためのボタンを提供するコンポーネント
 *
 * @param props コンポーネントのプロパティ
 * @returns Reactコンポーネント
 */
const ExecutionArea: React.FC<ExecutionAreaProps> = ({
  onGenerateMinutes,
  onDownloadTranscript,
  isGenerating,
  isLlmEndpointSet,
  useApiServer,
  hasTranscript = false,
  hasMarkdownContent = false,
  onDownloadMarkdown
}) => {
  // 議事録生成ボタンの非活性条件
  // 1. 生成中
  // 2. APIサーバー使用時にLLMエンドポイントが未設定
  // 3. トランスクリプトが存在しない
  const isGenerateButtonDisabled = isGenerating ||
    (useApiServer && !isLlmEndpointSet) ||
    !hasTranscript;

  // ダウンロードボタンの非活性条件
  // トランスクリプトが存在しない場合
  const isDownloadTranscriptDisabled = !hasTranscript;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4 text-center">
      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="flex flex-row justify-center gap-4">
          {/* 議事録生成ボタン */}
          <button
            onClick={onGenerateMinutes}
            disabled={isGenerateButtonDisabled}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner />
                <span>生成中...</span>
              </>
            ) : (
              '議事録生成'
            )}
          </button>

          {/* 文字起こしデータダウンロードボタン */}
          <button
            onClick={onDownloadTranscript}
            disabled={isDownloadTranscriptDisabled}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            文字起こしデータダウンロード(.txt)
          </button>

          {/* 議事録ダウンロードボタン */}
          {hasMarkdownContent && onDownloadMarkdown && (
            <button
              onClick={onDownloadMarkdown}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
            >
              議事録ダウンロード(.md)
            </button>
          )}
        </div>
      </div>

      {/* 生成中の追加説明 */}
      {isGenerating && (
        <p className="text-gray-600 text-sm mt-3 animate-pulse">
          LLMによる処理を実行中です。しばらくお待ちください...
        </p>
      )}

      {/* APIエンドポイント未設定時の警告 */}
      {useApiServer && !isLlmEndpointSet && (
        <p className="text-red-500 text-sm mt-2">APIサーバー使用時はLLM APIエンドポイントの設定が必要です。設定画面で指定してください。</p>
      )}

      {/* トランスクリプト未入力時の警告 */}
      {!hasTranscript && (
        <p className="text-red-500 text-sm mt-2">文字起こしデータが読み込まれていません。ファイルを選択してください。</p>
      )}
    </div>
  );
};

export default ExecutionArea;
