import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { useEffect, useState } from 'react'

interface Props {
  value: string
  options: string[]
  onChange: (value: string) => void
}

export default function SystemFilterCombobox({
  value,
  options,
  onChange,
}: Props) {
  const [query, setQuery] = useState(value)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const selectedOption = options.find((option) => option === value) ?? null
  const normalizedQuery = query.trim().toLowerCase()
  const filteredOptions =
    normalizedQuery === ''
      ? options
      : options.filter((name) => name.toLowerCase().includes(normalizedQuery))

  return (
    <Combobox
      value={selectedOption}
      onChange={(selectedValue: string | null) => {
        const nextValue = selectedValue ?? ''
        onChange(nextValue)
      }}
    >
      <div className="relative">
        <ComboboxInput
          aria-label="Filter system"
          displayValue={(currentValue: string | null) => currentValue ?? ''}
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)
          }}
          placeholder="Filter system"
          autoComplete="off"
          className="w-48 px-3 py-1.5 pr-8 text-sm font-medium rounded-md border bg-white text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 dark:text-gray-300 cursor-pointer">
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </ComboboxButton>
        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {filteredOptions.map((name) => (
            <ComboboxOption
              key={name}
              value={name}
              className="px-3 py-2 cursor-pointer text-gray-700 dark:text-gray-200 data-focus:bg-gray-100 dark:data-focus:bg-gray-700"
            >
              {name}
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </div>
    </Combobox>
  )
}
