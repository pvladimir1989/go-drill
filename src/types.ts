export type Lang = 'python' | 'go' | 'rust' | 'ts'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Tab = 'leet' | 'iv' | 'go' | 'rp' | 'bug' | 'arch'

export interface ArchOption {
  t: string
  ok?: boolean
  note?: string
}

export interface Problem {
  t: string
  d: Difficulty
  desc?: string
  python?: string
  go?: string
  rust?: string
  ts?: string
  /** Развёрнутое описание (англ. markdown) — панель «О задаче» */
  info?: string
  /** Постановка задачи (markdown) — вкладки go/rp */
  task?: string
  /** Код с багом (Go) — вкладка bug */
  buggy?: string
  /** Исправленный код (Go) — вкладка bug */
  fix?: string
  /** Разбор бага (markdown): что не так + почему + фикс — вкладка bug */
  bug?: string
  /** ASCII-схема «до» (проблема) — вкладка arch */
  diagram?: string
  /** Вопрос MCQ — вкладка arch */
  question?: string
  /** Варианты ответа — вкладка arch */
  options?: ArchOption[]
  /** ASCII-схема «после» (с добавленным компонентом) — вкладка arch */
  after?: string
  /** Ссылка на источник задачи */
  src?: string
  // injected at runtime when a problem is opened:
  category?: string
  icon?: string
}

export interface Category {
  name: string
  icon: string
  problems: Problem[]
}

export type Dataset = Category[]

export type Theme = 'all' | 'ch' | 'sync' | 'ctx' | 'flow'
export type Gran = 'tok' | 'line'

export interface Token {
  type:
    | 'newline'
    | 'ws'
    | 'comment'
    | 'string'
    | 'number'
    | 'keyword'
    | 'ident'
    | 'op'
  value: string
}
