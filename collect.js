'use strict';

const AWS = require('aws-sdk');
const kinesis = new AWS.Kinesis();

const STREAM_NAME = process.env.STREAM_NAME;

module.exports.handler = async (event = {}) => {
  try {
    await createRecord(event);
    return response();
  } catch(err) {
    return response(err, err.statusCode || 500);
  }
};

async function createRecord(event) {
  const { body = "", requestContext = {} } = event;
  const { id, event: analyticsEvent = {} } = JSON.parse(body);
  const { anonymousId, url, eventType, referrer, language } = analyticsEvent;
  const { identity = {} } = requestContext;
  
  if (!id || !anonymousId || !url || !eventType) {
    throw { error: 'id, anonymousId, url and eventType required', statusCode: 400 };
  }

  const params = {
    Data: JSON.stringify({
      id: id,
      anonymous_id: anonymousId,
      url: url,
      event_type: eventType,
      referrer: referrer,
      language: language,
      timestamp: (new Date()).toISOString(),
      source_ip: identity.sourceIp,
      user_agent: identity.userAgent
    }) + '\n',
    PartitionKey: anonymousId,
    StreamName: STREAM_NAME
  }

  return kinesis.putRecord(params).promise();
}

const response = (body, status) => {
  return {
    statusCode: status || 200,
    body: body && JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json'
    }
  }
}
