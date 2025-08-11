// Functional Programming Utilities
// Pure functions following functional programming principles

// Result Type for error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

export const Ok = <T>(data: T): Result<T, never> => ({ success: true, data })
export const Err = <E>(error: E): Result<never, E> => ({ success: false, error })

// Result utilities
export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } => 
  result.success

export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } => 
  !result.success

export const mapResult = <T, U, E>(
  result: Result<T, E>, 
  fn: (data: T) => U
): Result<U, E> => 
  isOk(result) ? Ok(fn(result.data)) : result

export const flatMapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> => 
  isOk(result) ? fn(result.data) : result

// Maybe Type for nullable values
export type Maybe<T> = T | null | undefined

export const isSome = <T>(value: Maybe<T>): value is T => 
  value !== null && value !== undefined

export const isNone = <T>(value: Maybe<T>): value is null | undefined => 
  value === null || value === undefined

export const mapMaybe = <T, U>(value: Maybe<T>, fn: (val: T) => U): Maybe<U> => 
  isSome(value) ? fn(value) : value as Maybe<U>

export const withDefault = <T>(value: Maybe<T>, defaultValue: T): T => 
  isSome(value) ? value : defaultValue

// Array utilities (pure functions)
export const groupBy = <T, K extends string | number>(
  array: T[], 
  keyFn: (item: T) => K
): Record<K, T[]> => 
  array.reduce((acc, item) => {
    const key = keyFn(item)
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {} as Record<K, T[]>)

export const unique = <T>(array: T[]): T[] => 
  [...new Set(array)]

export const uniqueBy = <T, K>(array: T[], keyFn: (item: T) => K): T[] => {
  const seen = new Set<K>()
  return array.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const partition = <T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] =>
  array.reduce(
    ([pass, fail], item) => 
      predicate(item) ? [[...pass, item], fail] : [pass, [...fail, item]],
    [[], []] as [T[], T[]]
  )

// Object utilities
export const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> =>
  keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key]
    return acc
  }, {} as Pick<T, K>)

export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

// Function composition
export const pipe = <T>(value: T) => ({
  map: <U>(fn: (val: T) => U) => pipe(fn(value)),
  filter: (predicate: (val: T) => boolean) => pipe(predicate(value) ? value : null),
  tap: (fn: (val: T) => void) => { fn(value); return pipe(value) },
  value: () => value
})

// Async utilities
export const asyncPipe = <T>(promise: Promise<T>) => ({
  map: <U>(fn: (val: T) => U) => asyncPipe(promise.then(fn)),
  flatMap: <U>(fn: (val: T) => Promise<U>) => asyncPipe(promise.then(fn)),
  catch: (fn: (error: unknown) => T) => asyncPipe(promise.catch(fn)),
  tap: (fn: (val: T) => void) => asyncPipe(promise.then(val => { fn(val); return val })),
  value: () => promise
})

// Retry function with exponential backoff
export const retry = async <T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<Result<T, Error>> => {
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await fn()
      return Ok(result)
    } catch (error) {
      if (i === attempts - 1) {
        return Err(error instanceof Error ? error : new Error(String(error)))
      }
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  return Err(new Error('Max attempts reached'))
}

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}