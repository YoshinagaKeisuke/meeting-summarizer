import { useState, useEffect } from 'react';
import './App.css';
import FileInputArea from './components/FileInputArea';
import FormatSpecArea from './components/FormatSpecArea';
import ExecutionArea from './components/ExecutionArea';
import OutputArea from './components/OutputArea';
import SettingsModal from './components/SettingsModal'; // 設定モーダルのインポート
import { CogIcon } from '@heroicons/react/24/outline'; // アイコンのインポート
import { LlmType } from './components/SettingsModal'; // LLM種類の型をインポート
import mammoth from 'mammoth'; // Wordファイル解析用ライブラリ
import { extractDate } from './lib/utils';
import {
  generateMinutesViaApi,
  generateMinutesDirectLlm,
  checkApiServerHealth
} from './lib/apiClient'; // APIクライアント関数のインポート

/**
 * トランスクリプトの各エントリを表すインターフェース
 */
interface TranscriptEntry {
  /** 発言者名 */
  speaker: string;
  /** 発言開始時間 (HH:MM:SS.mmm形式) */
  startTime: string;
  /** 発言終了時間 (HH:MM:SS.mmm形式) */
  endTime: string;
  /** 発言内容 */
  text: string;
}

/**
 * アプリケーションのメインコンポーネント
 * 全体の状態管理と主要機能の実装を行います
 */
function App() {
  // 状態変数の定義
  /** 生成された議事録のMarkdown内容 */
  const [markdownContent, setMarkdownContent] = useState('');
  /** 議事録生成中かどうかのフラグ */
  const [isGenerating, setIsGenerating] = useState(false);
  /** Gemini APIキー */
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  /** 選択されたファイル */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  /** 解析されたトランスクリプト */
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  /** 現在選択されているテンプレート内容 */
  const [currentTemplateContent, setCurrentTemplateContent] = useState<string>("");
  /** 現在のLLMプロンプト */
  const [currentLlmPrompt, setCurrentLlmPrompt] = useState<string>("");
  /** 設定モーダルの表示状態 */
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  /** 現在選択されているLLMの種類 */
  const [llmType, setLlmType] = useState<LlmType>('gemini');
  /** Ollama接続先URL */
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://localhost:11434');
  /** Ollamaモデル名 */
  const [ollamaModel, setOllamaModel] = useState<string>('llama2');
  /** トランスクリプトファイル名 */
  const [transcriptFileName, setTranscriptFileName] = useState<string>('');
  /** 解析された日付 */
  const [meetingDate, setmeetingDate] = useState<string>('');
  /** 生のトランスクリプトテキスト */
  const [rawTranscriptText, setRawTranscriptText] = useState<string>('');
  /** APIサーバーURL */
  const [apiServerUrl, setApiServerUrl] = useState<string>('http://localhost:3000');
  /** APIキー */
  const [apiKey, setApiKey] = useState<string>('meeting-summarizer-api-key-for-testing');
  /** APIサーバー使用フラグ */
  const [useApiServer, setUseApiServer] = useState<boolean>(true);
  /** APIサーバー接続状態 */
  const [apiServerConnected, setApiServerConnected] = useState<boolean>(false);
  /** LLM APIエンドポイントが設定されているかのフラグ（APIサーバー使用有無に応じて判定） */
  const [isLlmEndpointSet, setIsLlmEndpointSet] = useState<boolean>(false);

  /**
   * 初期化処理
   * ローカルストレージからAPIキーを読み込みます
   */
  useEffect(() => {
    // Gemini APIキーの読み込み
    const storedGeminiApiKey = localStorage.getItem('geminiApiKey');
    if (storedGeminiApiKey) {
      setGeminiApiKey(storedGeminiApiKey);
    }

    // LLM種類の読み込み
    const storedLlmType = localStorage.getItem('llmType') as LlmType;
    if (storedLlmType) {
      setLlmType(storedLlmType);
    }

    // Ollama設定の読み込み
    const storedOllamaUrl = localStorage.getItem('ollamaUrl');
    if (storedOllamaUrl) {
      setOllamaUrl(storedOllamaUrl);
    }

    const storedOllamaModel = localStorage.getItem('ollamaModel');
    if (storedOllamaModel) {
      setOllamaModel(storedOllamaModel);
    }

    // APIサーバー設定の読み込み
    const storedApiServerUrl = localStorage.getItem('apiServerUrl');
    if (storedApiServerUrl) {
      setApiServerUrl(storedApiServerUrl);
    }

    const storedApiServerKey = localStorage.getItem('apiKey');
    if (storedApiServerKey) {
      setApiKey(storedApiServerKey);
    }

    const storedUseApiServer = localStorage.getItem('useApiServer');
    if (storedUseApiServer !== null) {
      setUseApiServer(storedUseApiServer === 'true');
    }
  }, []);

  /**
   * APIサーバー接続状態の確認
   */
  useEffect(() => {
    const checkApiServer = async () => {
      if (useApiServer && apiServerUrl && apiKey) {
        try {
          const isConnected = await checkApiServerHealth(apiServerUrl, apiKey);
          setApiServerConnected(isConnected);
        } catch (error) {
          console.error("API server health check failed:", error);
          setApiServerConnected(false);
        }
      } else {
        setApiServerConnected(false);
      }
    };

    checkApiServer();
  }, [useApiServer, apiServerUrl, apiKey]);

  /**
   * LLM APIエンドポイント設定状態の更新
   * APIサーバー使用有無に応じて判定ロジックを分岐
   */
  useEffect(() => {
    let endpointSet = false;

    if (useApiServer) {
      // APIサーバーを使用する場合
      endpointSet = apiServerConnected;
    } else {
      // APIサーバーを使用しない場合
      if (llmType === 'gemini') {
        // Gemini APIの場合はAPIキーが設定されているかで判定
        endpointSet = !!geminiApiKey && geminiApiKey.trim() !== '';
      } else if (llmType === 'ollama') {
        // Ollamaの場合はURLとモデル名が設定されているかで判定
        endpointSet = !!ollamaUrl && !!ollamaModel && ollamaUrl.trim() !== '' && ollamaModel.trim() !== '';
      }
    }

    console.log(`LLM Endpoint Set: ${endpointSet}, UseApiServer: ${useApiServer}, LlmType: ${llmType}, GeminiKey: ${!!geminiApiKey}`);
    setIsLlmEndpointSet(endpointSet);
  }, [useApiServer, apiServerConnected, llmType, geminiApiKey, ollamaUrl, ollamaModel]);

  /**
   * ファイル選択時のハンドラ
   * @param file 選択されたファイル（またはnull）
   */
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      // ファイル名を設定
      setTranscriptFileName(file.name.replace(/\.[^/.]+$/, ""));
      // ファイル名から会議日時を抽出
      setmeetingDate(extractDate(transcriptFileName) || '');

      // ファイル拡張子に基づいて処理を分岐
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'vtt') {
        parseVttFile(file);
      } else if (fileExtension === 'txt') {
        parseTxtFile(file);
      } else if (fileExtension === 'docx') {
        parseDocxFile(file);
      } else {
        alert('サポートされていないファイル形式です。.vtt、.txt、または.docxファイルを選択してください。');
        setTranscript([]);
        setRawTranscriptText('');
      }
    } else {
      // ファイルが選択解除された場合はトランスクリプトをクリア
      setTranscript([]);
      setRawTranscriptText('');
    }
  };

  /**
   * DOCXファイルを解析する関数
   * @param file 解析対象のDOCXファイル
   */
  const parseDocxFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      setRawTranscriptText(text);

      // 簡易的なパース処理（行ごとに分割して話者と内容を抽出）
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const parsedTranscript: TranscriptEntry[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // 話者名を抽出（例: "山田太郎:" や "山田太郎："や "山田太郎  " のようなパターン）
        let speakerMatch = line.match(/^(.+?)\s+\d{1,2}\s*:\s*\d{1,2}/);
        if (!speakerMatch) {
          speakerMatch = line.match(/^(.+?)[\s:：]+/);
        }

        if (speakerMatch) {
          const speaker = speakerMatch[1].trim();
          const content = line.substring(speakerMatch[1].length).trim();

          const timeRangeMatch = content.match(
            /^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?[\-~〜\s　]+(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?/
          );
          let startTime = '';
          let endTime = '';
          if (timeRangeMatch) {
            // startTime
            const sh = timeRangeMatch[3] ? timeRangeMatch[1] : '00';
            const sm = timeRangeMatch[3] ? timeRangeMatch[2] : timeRangeMatch[1];
            const ss = timeRangeMatch[3] ? timeRangeMatch[3] : timeRangeMatch[2];
            const sms = timeRangeMatch[4] ? timeRangeMatch[4].padEnd(3, '0') : '000';
            startTime = `${sh.padStart(2, '0')}:${sm.padStart(2, '0')}:${ss.padStart(2, '0')}.${sms}`;
            // endTime
            const eh = timeRangeMatch[7] ? timeRangeMatch[5] : '00';
            const em = timeRangeMatch[7] ? timeRangeMatch[6] : timeRangeMatch[5];
            const es = timeRangeMatch[7] ? timeRangeMatch[7] : timeRangeMatch[6];
            const ems = timeRangeMatch[8] ? timeRangeMatch[8].padEnd(3, '0') : '000';
            endTime = `${eh.padStart(2, '0')}:${em.padStart(2, '0')}:${es.padStart(2, '0')}.${ems}`;
          } else {
            // 1つだけ時間がある場合（コロン前後の空白も許容）
            const timeMatchRaw = content.match(/^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?/);
            if (timeMatchRaw) {
              const h = timeMatchRaw[3] ? timeMatchRaw[1] : '00';
              const m = timeMatchRaw[3] ? timeMatchRaw[2] : timeMatchRaw[1];
              const s = timeMatchRaw[3] ? timeMatchRaw[3] : timeMatchRaw[2];
              const ms = timeMatchRaw[4] ? timeMatchRaw[4].padEnd(3, '0') : '000';
              startTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}.${ms}`;
              endTime = '';
            }
          }

          // contentから時間部分を除去
          const contentWithoutTime = content
            .replace(
              /^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?[\-~〜\s　]+(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?/,
              ''
            )
            .replace(
              /^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?/,
              ''
            )
            .trim();

          parsedTranscript.push({
            speaker,
            startTime,
            endTime,
            text: contentWithoutTime
          });
        } else {
          // 話者名が見つからない場合は、前の話者の続きとして扱う
          if (parsedTranscript.length > 0) {
            const lastEntry = parsedTranscript[parsedTranscript.length - 1];
            lastEntry.text += line;
          } else {
            // 最初の行に話者名がない場合は、そのまま追加
            parsedTranscript.push({
              speaker: '',
              startTime: '',
              endTime: '',
              text: line
            });
          }
        }
      }

      setTranscript(parsedTranscript);
    } catch (error) {
      console.error('DOCXファイルの解析に失敗しました:', error);
      alert('DOCXファイルの解析に失敗しました。ファイル形式を確認してください。');
    }
  };

  /**
   * TXTファイルを解析する関数
   * @param file 解析対象のTXTファイル
   */
  const parseTxtFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawTranscriptText(text);

      // 簡易的なパース処理（行ごとに分割して話者と内容を抽出）
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const parsedTranscript: TranscriptEntry[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // 話者名を抽出（例: "山田太郎:" や "山田太郎："や "山田太郎  " のようなパターン）
        let speakerMatch = line.match(/^(.+?)\s+\d{1,2}\s*:\s*\d{1,2}/);
        if (!speakerMatch) {
          speakerMatch = line.match(/^(.+?)[\s:：]+/);
        }

        if (speakerMatch) {
          const speaker = speakerMatch[1].trim();
          const content = line.substring(speakerMatch[1].length).trim();

          const timeRangeMatch = content.match(
            /^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?[\-~〜\s　]+(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?/
          );
          let startTime = '';
          let endTime = '';
          if (timeRangeMatch) {
            // startTime
            const sh = timeRangeMatch[3] ? timeRangeMatch[1] : '00';
            const sm = timeRangeMatch[3] ? timeRangeMatch[2] : timeRangeMatch[1];
            const ss = timeRangeMatch[3] ? timeRangeMatch[3] : timeRangeMatch[2];
            const sms = timeRangeMatch[4] ? timeRangeMatch[4].padEnd(3, '0') : '000';
            startTime = `${sh.padStart(2, '0')}:${sm.padStart(2, '0')}:${ss.padStart(2, '0')}.${sms}`;
            // endTime
            const eh = timeRangeMatch[7] ? timeRangeMatch[5] : '00';
            const em = timeRangeMatch[7] ? timeRangeMatch[6] : timeRangeMatch[5];
            const es = timeRangeMatch[7] ? timeRangeMatch[7] : timeRangeMatch[6];
            const ems = timeRangeMatch[8] ? timeRangeMatch[8].padEnd(3, '0') : '000';
            endTime = `${eh.padStart(2, '0')}:${em.padStart(2, '0')}:${es.padStart(2, '0')}.${ems}`;
          } else {
            // 1つだけ時間がある場合（コロン前後の空白も許容）
            const timeMatchRaw = content.match(/^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?/);
            if (timeMatchRaw) {
              const h = timeMatchRaw[3] ? timeMatchRaw[1] : '00';
              const m = timeMatchRaw[3] ? timeMatchRaw[2] : timeMatchRaw[1];
              const s = timeMatchRaw[3] ? timeMatchRaw[3] : timeMatchRaw[2];
              const ms = timeMatchRaw[4] ? timeMatchRaw[4].padEnd(3, '0') : '000';
              startTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}.${ms}`;
              endTime = '';
            }
          }

          // contentから時間部分を除去
          const contentWithoutTime = content
            .replace(
              /^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?[\-~〜\s　]+(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?/,
              ''
            )
            .replace(
              /^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?(?:\.(\d{1,3}))?/,
              ''
            )
            .trim();

          parsedTranscript.push({
            speaker,
            startTime,
            endTime,
            text: contentWithoutTime
          });
        } else {
          // 話者名が見つからない場合は、前の話者の続きとして扱う
          if (parsedTranscript.length > 0) {
            const lastEntry = parsedTranscript[parsedTranscript.length - 1];
            lastEntry.text += line;
          } else {
            // 最初の行に話者名がない場合は、そのまま追加
            parsedTranscript.push({
              speaker: '',
              startTime: '',
              endTime: '',
              text: line
            });
          }
        }
      }

      setTranscript(parsedTranscript);
    };
    reader.readAsText(file);
  };

  /**
   * VTTファイルを解析する関数
   * @param file 解析対象のVTTファイル
   */
  const parseVttFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawTranscriptText(text);

      // VTTファイルのパース処理
      const lines = text.split('\n');
      const parsedTranscript: TranscriptEntry[] = [];

      let i = 0;
      // VTTヘッダーをスキップ
      while (i < lines.length && !lines[i].includes('-->')) {
        i++;
      }

      while (i < lines.length) {
        const line = lines[i].trim();

        // タイムスタンプ行を検出
        if (line.includes('-->')) {
          const timeMatch = line.match(/(\d+:\d+:\d+\.\d+)\s+-->\s+(\d+:\d+:\d+\.\d+)/);
          if (timeMatch) {
            const startTime = timeMatch[1];
            const endTime = timeMatch[2];

            // 次の行が話者名と内容
            i++;
            if (i < lines.length) {
              const contentLine = lines[i].trim();
              // 話者名を抽出（例: "<v 山田太郎>" のようなパターン）
              const speakerMatch = contentLine.match(/<v\s+([^>]+)>/);

              let speaker = '不明';
              let text = contentLine;

              if (speakerMatch) {
                speaker = speakerMatch[1] || speakerMatch[2];
                // 話者名部分を除去して内容だけを取得
                text = contentLine.replace(/<v\s+[^>]+>|<\/v>/g, '').trim();
              }

              // 直前のエントリと話者が同じ場合は連結
              const lastEntry = parsedTranscript[parsedTranscript.length - 1];
              if (
                lastEntry &&
                lastEntry.speaker === speaker
              ) {
                lastEntry.endTime = endTime;
                lastEntry.text += text;
              } else {
                parsedTranscript.push({
                  speaker,
                  startTime,
                  endTime,
                  text
                });
              }
            }
          }
        }

        i++;
      }

      setTranscript(parsedTranscript);
    };
    reader.readAsText(file);
  };

  /**
   * 議事録生成処理
   * トランスクリプトからLLMを使用して議事録を生成します
   */
  const handleGenerateMinutes = async () => {
    if (!transcript.length && !rawTranscriptText) {
      alert('文字起こしデータが読み込まれていません。ファイルを選択してください。');
      return;
    }

    // テンプレートとLLMプロンプトのチェックは警告のみとし、生成は続行
    if (!currentTemplateContent) {
      console.warn('テンプレートが設定されていません。デフォルト設定で続行します。');
    }

    if (!currentLlmPrompt) {
      console.warn('LLMプロンプトが設定されていません。デフォルト設定で続行します。');
    }

    // 生成中フラグをセット
    setIsGenerating(true);
    setMarkdownContent('');

    try {
      let result = '';

      // APIサーバーを使用するかどうかで処理を分岐
      if (useApiServer) {
        // APIサーバー経由で生成
        console.log('Using API server for generation');
        result = await generateMinutesViaApi(
          apiServerUrl,
          apiKey,
          rawTranscriptText,
          transcript,
          transcriptFileName,
          meetingDate,
          currentTemplateContent,
          currentLlmPrompt,
          llmType,
          geminiApiKey,
          ollamaUrl,
          ollamaModel
        );
      } else {
        // APIサーバーを使用せず直接LLMを呼び出す
        console.log('Using direct LLM for generation');
        result = await generateMinutesDirectLlm(
          rawTranscriptText,
          transcript,
          transcriptFileName,
          meetingDate,
          currentTemplateContent,
          currentLlmPrompt,
          llmType,
          geminiApiKey,
          ollamaUrl,
          ollamaModel
        );
      }

      setMarkdownContent(result);
    } catch (error) {
      console.error('議事録の生成に失敗しました:', error);
      alert(`議事録の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 文字起こしデータをダウンロードする関数
   */
  const handleDownloadTranscript = () => {
    if (!transcript) {
      alert('文字起こしデータが解析できません。');
      return;
    }

    const transcriptText = transcript.map(entry => {
      const timeInfo = entry.startTime ? `[${entry.startTime}] ` : '';
      return `${timeInfo}${entry.speaker}: ${entry.text}`;
    }).join('\n\n');

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcriptFileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * 生成された議事録をMarkdownファイルとしてダウンロードする関数
   */
  const handleDownloadMarkdown = () => {
    if (!markdownContent) {
      alert('議事録が生成されていません。');
      return;
    }

    const formattedMarkdown = markdownContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    const blob = new Blob([formattedMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcriptFileName}_minutes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * 設定モーダルを開く関数
   */
  const handleOpenSettingsModal = () => {
    setShowSettingsModal(true);
  };

  /**
   * 設定モーダルを閉じる関数
   */
  const handleCloseSettingsModal = () => {
    setShowSettingsModal(false);
  };

  /**
   * 設定を保存する関数
   * @param newGeminiApiKey 新しいGemini APIキー
   * @param newLlmType 新しいLLM種類
   * @param newOllamaUrl 新しいOllama URL
   * @param newOllamaModel 新しいOllamaモデル名
   * @param newApiServerUrl 新しいAPIサーバーURL
   * @param newApiKey 新しいAPIキー
   * @param newUseApiServer 新しいAPIサーバー使用フラグ
   */
  const handleSaveSettings = (
    newGeminiApiKey: string,
    newLlmType: LlmType,
    newOllamaUrl: string,
    newOllamaModel: string,
    newApiServerUrl: string,
    newApiKey: string,
    newUseApiServer: boolean
  ) => {
    // Gemini APIキーの更新
    setGeminiApiKey(newGeminiApiKey);
    localStorage.setItem('geminiApiKey', newGeminiApiKey);

    // LLM種類の更新
    setLlmType(newLlmType);
    localStorage.setItem('llmType', newLlmType);

    // Ollama設定の更新
    setOllamaUrl(newOllamaUrl);
    localStorage.setItem('ollamaUrl', newOllamaUrl);
    setOllamaModel(newOllamaModel);
    localStorage.setItem('ollamaModel', newOllamaModel);

    // APIサーバー設定の更新
    setApiServerUrl(newApiServerUrl);
    localStorage.setItem('apiServerUrl', newApiServerUrl);
    setApiKey(newApiKey);
    localStorage.setItem('apiKey', newApiKey);
    setUseApiServer(newUseApiServer);
    localStorage.setItem('useApiServer', String(newUseApiServer));

    // 設定モーダルを閉じる
    handleCloseSettingsModal();
  };

  // トランスクリプトが存在するかどうかを判定
  const hasTranscript = transcript.length > 0 || !!rawTranscriptText;

  // 議事録内容が存在するかどうかを判定
  const hasMarkdownContent = !!markdownContent;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white shadow-md rounded-lg p-6 mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">議事録自動生成ツール</h1>
          <button
            onClick={handleOpenSettingsModal}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg flex items-center"
          >
            <CogIcon className="h-5 w-5 mr-2" />
            設定
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <FileInputArea
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />

          <FormatSpecArea
            onTemplateContentChange={setCurrentTemplateContent}
            onLlmPromptChange={setCurrentLlmPrompt}
            currentLlmPrompt={currentLlmPrompt}
          />

          <ExecutionArea
            isGenerating={isGenerating}
            isLlmEndpointSet={isLlmEndpointSet}
            useApiServer={useApiServer}
            onGenerateMinutes={handleGenerateMinutes}
            onDownloadTranscript={handleDownloadTranscript}
            hasTranscript={hasTranscript}
            hasMarkdownContent={hasMarkdownContent}
            onDownloadMarkdown={handleDownloadMarkdown}
          />

          <OutputArea
            markdownContent={markdownContent}
            onMarkdownChange={setMarkdownContent}
          />
        </div>
      </div>

      <SettingsModal
        isOpen={showSettingsModal}
        geminiApiKey={geminiApiKey}
        llmType={llmType}
        ollamaUrl={ollamaUrl}
        ollamaModel={ollamaModel}
        apiServerUrl={apiServerUrl}
        apiKey={apiKey}
        useApiServer={useApiServer}
        apiServerConnected={apiServerConnected}
        onClose={handleCloseSettingsModal}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

export default App;
