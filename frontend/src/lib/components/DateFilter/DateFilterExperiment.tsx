import React, { useEffect, useRef } from 'react'
import { Select } from 'antd'
import { SelectProps } from 'antd/lib/select'
import { dateMappingExperiment, dateFilterToText } from 'lib/utils'
import { DateFilterRange } from 'lib/components/DateFilter/DateFilterRangeExperiment'
import { dayjs } from 'lib/dayjs'
import { dateMappingOption } from '~/types'
import { LemonDivider } from 'lib/components/LemonDivider/LemonDivider'
import './DateFilterExperiment.scss'
import { Tooltip } from 'lib/components/Tooltip'
import { dateFilterLogic } from './DateFilterExperimentLogic'
import { RollingDateRangeFilter } from './RollingDateRangeFilter'
import { useActions, useValues } from 'kea'

export interface DateFilterProps {
    defaultValue: string
    showCustom?: boolean
    showRollingRangePicker?: boolean
    bordered?: boolean
    makeLabel?: (key: React.ReactNode) => React.ReactNode
    style?: React.CSSProperties
    onChange?: (fromDate: string, toDate: string) => void
    disabled?: boolean
    getPopupContainer?: (props: any) => HTMLElement
    dateOptions?: Record<string, dateMappingOption>
    isDateFormatted?: boolean
    selectProps?: SelectProps<any>
}

interface RawDateFilterProps extends DateFilterProps {
    dateFrom?: string | null | dayjs.Dayjs
    dateTo?: string | null | dayjs.Dayjs
}

export function DateFilterExperiment({
    bordered,
    defaultValue,
    showCustom,
    showRollingRangePicker = true,
    style,
    disabled,
    makeLabel,
    onChange,
    getPopupContainer,
    dateFrom,
    dateTo,
    dateOptions = dateMappingExperiment,
    isDateFormatted = true,
    selectProps = {},
}: RawDateFilterProps): JSX.Element {
    const logicProps = { dateFrom, dateTo, onChange, defaultValue, dateOptions, isDateFormatted }
    const { open, openDateRange, close, setRangeDateFrom, setRangeDateTo, setDate } = useActions(
        dateFilterLogic(logicProps)
    )
    const { isOpen, isDateRangeOpen, rangeDateFrom, rangeDateTo, currentKey } = useValues(dateFilterLogic(logicProps))

    const optionsRef = useRef<HTMLDivElement | null>(null)
    const rollingDateRangeRef = useRef<HTMLDivElement | null>(null)

    function _onChange(v: string): void {
        if (v === 'Date range') {
            openDateRange()
            if (isOpen) {
            }
        } else {
            setDate(dateOptions[v].values[0], dateOptions[v].values[1])
            close()
        }
    }

    function onClick(): void {
        if (isDateRangeOpen) {
            return
        }
        open()
    }

    function dropdownOnClick(e: React.MouseEvent): void {
        e.preventDefault()
        open()
        document.getElementById('daterange_selector')?.focus()
    }

    function onApplyClick(): void {
        close()
        const formattedRangeDateFrom = dayjs(rangeDateFrom).format('YYYY-MM-DD')
        const formattedRangeDateTo = dayjs(rangeDateTo).format('YYYY-MM-DD')
        setDate(formattedRangeDateFrom, formattedRangeDateTo)
    }

    const onClickOutside = (event: MouseEvent): void => {
        const target = (event.composedPath?.()?.[0] || event.target) as HTMLElement

        if (!target) {
            return
        }

        const clickInOptionsDropdown = optionsRef.current?.contains(target)

        const clickInDateDropdown = event
            .composedPath?.()
            ?.find((e) => (e as HTMLElement)?.matches?.('.rolling-date-range-options-selector-popup'))

        const isNotDateOptionsSelector =
            !showRollingRangePicker || (isOpen && showRollingRangePicker && !clickInDateDropdown)

        if (isOpen && !clickInOptionsDropdown && isNotDateOptionsSelector) {
            close()
            return
        }
    }

    useEffect(() => {
        window.addEventListener('mousedown', onClickOutside)
        return () => {
            window.removeEventListener('mousedown', onClickOutside)
        }
    }, [isOpen])

    return (
        <Select
            data-attr="date-filter"
            bordered={bordered}
            id="daterange_selector"
            value={currentKey}
            onChange={_onChange}
            style={style}
            open={isOpen || isDateRangeOpen}
            onClick={onClick}
            listHeight={440}
            dropdownMatchSelectWidth={false}
            disabled={disabled}
            optionLabelProp={makeLabel ? 'label' : undefined}
            getPopupContainer={getPopupContainer}
            dropdownRender={() => {
                if (isDateRangeOpen) {
                    return (
                        <DateFilterRange
                            getPopupContainer={getPopupContainer}
                            onClick={dropdownOnClick}
                            onDateFromChange={(date) => setRangeDateFrom(date)}
                            onDateToChange={(date) => setRangeDateTo(date)}
                            onApplyClick={onApplyClick}
                            onClickOutside={close}
                            rangeDateFrom={rangeDateFrom}
                            rangeDateTo={rangeDateTo}
                            disableBeforeYear={2015}
                        />
                    )
                } else if (isOpen) {
                    return (
                        <div ref={optionsRef} className="date-filter-options" onClick={(e) => e.stopPropagation()}>
                            {[
                                ...Object.entries(dateOptions).map(([key, { values, inactive }]) => {
                                    if (key === 'Custom' && !showCustom) {
                                        return null
                                    }

                                    if (inactive && currentKey !== key) {
                                        return null
                                    }

                                    const dateValue = dateFilterToText(
                                        values[0],
                                        values[1],
                                        defaultValue,
                                        dateOptions,
                                        isDateFormatted
                                    )

                                    return (
                                        <Tooltip key={key} title={makeLabel ? makeLabel(dateValue) : undefined}>
                                            <div className="custom-range-button" onClick={() => _onChange(key)}>
                                                {key}
                                            </div>
                                        </Tooltip>
                                    )
                                }),
                            ]}
                            {showRollingRangePicker && (
                                <div ref={rollingDateRangeRef}>
                                    <RollingDateRangeFilter
                                        onChange={(fromDate, toDate) => {
                                            setDate(fromDate, toDate)
                                            close()
                                        }}
                                        makeLabel={makeLabel}
                                    />
                                </div>
                            )}
                            <LemonDivider />
                            <div className="custom-range-button" onClick={() => _onChange('Date range')}>
                                {'Custom fixed time period'}
                            </div>
                        </div>
                    )
                } else {
                    return <></>
                }
            }}
            {...selectProps}
        />
    )
}
