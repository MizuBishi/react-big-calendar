import cn from 'classnames';
import getHeight from 'dom-helpers/query/height';
import qsa from 'dom-helpers/query/querySelectorAll';
import PropTypes from 'prop-types';
import React from 'react';
import { findDOMNode } from 'react-dom';

import dates from './utils/dates';
import { accessor, elementType } from './utils/propTypes';
import { segStyle, eventSegments, endOfRange, eventLevels } from './utils/eventLevels';
import BackgroundCells from './BackgroundCells';
import EventRow from './EventRow';
import EventEndingRow from './EventEndingRow';

let isSegmentInSlot = (seg, slot) => seg.left <= slot && seg.right >= slot;

const propTypes = {
  date: PropTypes.instanceOf(Date),
  events: PropTypes.array.isRequired,
  range: PropTypes.array.isRequired,

  rtl: PropTypes.bool,
  renderForMeasure: PropTypes.bool,
  renderHeader: PropTypes.func,

  container: PropTypes.func,
  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),

  onShowMore: PropTypes.func,
  onSelectSlot: PropTypes.func,
  onSelectEnd: PropTypes.func,
  onSelectStart: PropTypes.func,

  now: PropTypes.instanceOf(Date),
  startAccessor: accessor.isRequired,
  endAccessor: accessor.isRequired,

  dateCellWrapper: elementType,
  eventComponent: elementType,
  eventWrapperComponent: elementType.isRequired,
  minRows: PropTypes.number.isRequired,
  maxRows: PropTypes.number.isRequired,
};

const defaultProps = {
  minRows: 3,
  maxRows: Infinity,
}

class DateContentRow extends React.Component {

  constructor(...args) {
    super(...args);
  }

  handleSelectSlot = (slot) => {
    const { range, onSelectSlot } = this.props;

    onSelectSlot(
      range.slice(slot.start, slot.end + 1),
      slot,
    )
  }

  handleShowMore = (slot) => {
    const { range, onShowMore } = this.props;
    let row = qsa(findDOMNode(this), '.rbc-row-bg')[0]

    let cell;
    if (row) cell = row.children[slot-1]

    let events = this.segments
      .filter(seg => isSegmentInSlot(seg, slot))
      .map(seg => seg.event)

    onShowMore(events, range[slot-1], cell, slot)
  }

  createHeadingRef = r => {
    this.headingRow = r;
  }

  createEventRef = r => {
    this.eventRow = r;
  }

  getContainer = () => {
    const { container } = this.props;
    return container ? container() : findDOMNode(this)
  }

  getRowLimit() {
    let eventHeight = getHeight(this.eventRow);
    let headingHeight = this.headingRow ? getHeight(this.headingRow) : 0
    let eventSpace = getHeight(findDOMNode(this)) - headingHeight;

    return Math.max(Math.floor(eventSpace / eventHeight), 1)
  }


  renderDummy = () => {
    let { className, range } = this.props;
    return (
      <div className={className}>
        <div className='rbc-row-content'>
          <div className='rbc-row' ref={this.createEventRef}>
            <div className='rbc-row-segment' style={segStyle(1, range.length)}>
              <div className='rbc-event'>
                <div className='rbc-event-content'>&nbsp;</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const {
      rtl,
      now,
      date,
      events,
      range,
      className,
      selectable,
      renderForMeasure,
      startAccessor,
      endAccessor,
      renderHeader,
      minRows, maxRows,
      dateCellWrapper,
      eventComponent,
      eventWrapperComponent,
      onSelectStart,
      onSelectEnd,
      ...props
    } = this.props;

    if (renderForMeasure)
      return this.renderDummy();

    let { first, last } = endOfRange(range);

    let segments = this.segments = events.map(evt => eventSegments(evt, first, last, {
      startAccessor,
      endAccessor
    }, range))

    let { levels, extra } = eventLevels(segments, Math.max(maxRows - 1, 1));
    while (levels.length < minRows ) levels.push([])

    return (
      <div className={className}>
        <BackgroundCells
          rtl={rtl}
          now={now}
          date={date}
          range={range}
          renderHeader={renderHeader}
          selectable={selectable}
          container={this.getContainer}
          onSelectStart={onSelectStart}
          onSelectEnd={onSelectEnd}
          onSelectSlot={this.handleSelectSlot}
          cellWrapperComponent={dateCellWrapper}
        />

        <div className='rbc-row-content'>
          <div className='rbc-row body'>
              {levels.map((segs, idx) =>
                <EventRow
                  {...props}
                  key={idx}
                  start={first}
                  end={last}
                  segments={segs}
                  slots={range.length}
                  eventComponent={eventComponent}
                  eventWrapperComponent={eventWrapperComponent}
                  startAccessor={startAccessor}
                  endAccessor={endAccessor}
                />
              )}
              {!!extra.length && (
                <EventEndingRow
                  {...props}
                  start={first}
                  end={last}
                  segments={extra}
                  onShowMore={this.handleShowMore}
                  eventComponent={eventComponent}
                  eventWrapperComponent={eventWrapperComponent}
                />
              )}
          </div>
        </div>
      </div>
    );
  }
}

DateContentRow.propTypes = propTypes;
DateContentRow.defaultProps = defaultProps;

export default DateContentRow
