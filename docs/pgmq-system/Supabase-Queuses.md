### List All PGMQ Queues (PostgreSQL)

Source: https://supabase.com/docs/guides/queues/pgmq

Retrieves a list of all existing PGMQ queues. It returns a table with details for each queue, including its name, creation timestamp, and whether it is partitioned or unlogged. This function is `pgmq.list_queues()` and takes no parameters.

```sql
list_queues()RETURNS TABLE(
    queue_name text,
    created_at timestamp with time zone,
    is_partitioned boolean,
    is_unlogged boolean)
```

```sql
select * from pgmq.list_queues();
```

--------------------------------

### Create pgmq Queue for Embedding Jobs

Source: https://supabase.com/docs/guides/ai/automatic-embeddings

Creates a PostgreSQL message queue named 'embedding_jobs' using pgmq. This queue stores embedding job requests that will be processed asynchronously by the batch processor function.

```sql
select pgmq.create('embedding_jobs');
```

--------------------------------

### Get PGMQ Queue Metrics (PostgreSQL)

Source: https://supabase.com/docs/guides/queues/pgmq

Fetches detailed metrics for a specified PGMQ queue. The returned table includes queue length, age of the newest and oldest messages, total messages processed, and the scrape time. This function requires `pgmq.metrics` and takes the queue name as input.

```sql
pgmq.metrics(queue_name: text)returns table(
    queue_name text,
    queue_length bigint,
    newest_msg_age_sec integer,
    oldest_msg_age_sec integer,
    total_messages bigint,
    scrape_time timestamp with time zone)
```

```sql
select * from pgmq.metrics('my_queue');
```

--------------------------------

### GET metrics_all() - Retrieve All Queue Metrics

Source: https://supabase.com/docs/guides/queues/pgmq

Retrieves comprehensive metrics for all existing message queues in PGMQ. Returns a table containing queue names, current queue lengths, message ages, total message counts, and the current timestamp for each queue.

```APIDOC
## metrics_all()

### Description
Get metrics for all existing queues. Returns a table with detailed information about each queue's current state and message statistics.

### Method
Function Call

### Endpoint
pgmq.metrics_all()

### Parameters
None

### Request Example
```sql
select * from pgmq.metrics_all();
```

### Response
#### Success Response (Returns TABLE)
- **queue_name** (text) - The name of the queue
- **queue_length** (bigint) - Number of messages currently in the queue
- **newest_msg_age_sec** (integer | null) - Age of the newest message in the queue, in seconds
- **oldest_msg_age_sec** (integer | null) - Age of the oldest message in the queue, in seconds
- **total_messages** (bigint) - Total number of messages that have passed through the queue over all time
- **scrape_time** (timestamp with time zone) - The current timestamp

#### Response Example
```
       queue_name      | queue_length | newest_msg_age_sec | oldest_msg_age_sec | total_messages |          scrape_time
----------------------+--------------+--------------------+--------------------+----------------+-------------------------------
 my_queue             |           16 |               2563 |               2565 |             35 | 2023-10-28 20:25:07.016413-05
 my_partitioned_queue |            1 |                 11 |                 11 |              1 | 2023-10-28 20:25:07.016413-05
 my_unlogged          |            1 |                  3 |                  3 |              1 | 2023-10-28 20:25:07.016413-05
```
```

--------------------------------

### Query All Queue Metrics - pgmq SQL Example

Source: https://supabase.com/docs/guides/queues/pgmq

Example query demonstrating how to retrieve metrics from all queues using pgmq.metrics_all(). Shows the result set with multiple queues and their respective statistics including queue length, message ages, and timestamps.

```SQL
select * from pgmq.metrics_all();

     queue_name      | queue_length | newest_msg_age_sec | oldest_msg_age_sec | total_messages |          scrape_time
---------------------+--------------+--------------------+--------------------+----------------+-------------------------------
 my_queue             |           16 |               2563 |               2565 |             35 | 2023-10-28 20:25:07.016413-05
 my_partitioned_queue |            1 |                 11 |                 11 |              1 | 2023-10-28 20:25:07.016413-05
 my_unlogged          |            1 |                  3 |                  3 |              1 | 2023-10-28 20:25:07.016413-05
```

--------------------------------

### read_with_poll - Read Messages with Long Poll

Source: https://supabase.com/docs/guides/queues/pgmq

Reads messages from a queue with long-polling functionality. When the queue is empty, the function waits for up to max_poll_seconds before returning. If messages arrive during the wait period, they are returned immediately.

```APIDOC
## read_with_poll

### Description
Reads messages from a queue with convenient long-poll functionality. When there are no messages in the queue, the function call will wait for max_poll_seconds in duration before returning. If messages reach the queue during that duration, they will be read and returned immediately.

### Function Signature
```
pgmq.read_with_poll(
  queue_name text,
  vt integer,
  qty integer,
  max_poll_seconds integer default 5,
  poll_interval_ms integer default 100
) returns setof pgmq.message_record
```

### Parameters
- **queue_name** (text) - Required - The name of the queue
- **vt** (integer) - Required - Time in seconds that the message becomes invisible after reading
- **qty** (integer) - Required - The number of messages to read from the queue. Defaults to 1
- **max_poll_seconds** (integer) - Optional - Time in seconds to wait for new messages to reach the queue. Defaults to 5
- **poll_interval_ms** (integer) - Optional - Milliseconds between internal poll operations. Defaults to 100

### Returns
- **setof pgmq.message_record** - Set of message records containing: msg_id, read_ct, enqueued_at, vt, message

### Request Example
```sql
select * from pgmq.read_with_poll('my_queue', 1, 1, 5, 100);
```

### Response Example
```
msg_id | read_ct |          enqueued_at          |              vt               |      message
-------+---------+-------------------------------+-------------------------------+--------------------
      1 |       1 | 2023-10-28 19:09:09.177756-05 | 2023-10-28 19:27:00.337929-05 | {"hello": "world"}
```
```

--------------------------------

### Create Queue with PGMQ

Source: https://supabase.com/docs/guides/queues/pgmq

Creates a new message queue with the specified name. This initializes the queue table and associated infrastructure for storing messages.

```sql
pgmq.create(queue_name text) returns void
```

```sql
select * from pgmq.create('my_queue');
```

--------------------------------

### Get All Queue Metrics - pgmq SQL Function

Source: https://supabase.com/docs/guides/queues/pgmq

Retrieves comprehensive metrics for all existing message queues in pgmq. Returns a table containing queue names, message counts, message ages, and timestamps. This function is useful for monitoring queue health and performance across all queues in the system.

```SQL
pgmq.metrics_all()
RETURNS TABLE(
    queue_name text,
    queue_length bigint,
    newest_msg_age_sec integer,
    oldest_msg_age_sec integer,
    total_messages bigint,
    scrape_time timestamp with time zone
)
```

--------------------------------

### Send Batch Messages to PGMQ Queue

Source: https://supabase.com/docs/guides/queues/pgmq

Sends multiple JSON messages to a queue in a single operation with optional delay. Returns message IDs for each sent message. More efficient than sending messages individually.

```sql
pgmq.send_batch(
    queue_name text,
    msgs jsonb[],
    delay integer default 0
) returns setof bigint
```

```sql
select * from pgmq.send_batch(
    'my_queue',
    array[
      '{"hello": "world_0"}'::jsonb,
      '{"hello": "world_1"}'::jsonb
    ]
);
```

--------------------------------

### pgmq_public.send_batch() - Send Multiple Messages

Source: https://supabase.com/docs/guides/queues/api

Adds a batch of messages to a specified Queue in a single operation with optional visibility delay. This is more efficient than sending messages individually when you have multiple messages to queue.

```APIDOC
## pgmq_public.send_batch(queue_name, messages, sleep_seconds)

### Description
Adds a batch of Messages to the specified Queue, optionally delaying their availability to all consumers by a number of seconds.

### Function Signature
```
pgmq_public.send_batch(queue_name text, messages jsonb[], sleep_seconds integer DEFAULT 0)
```

### Parameters
#### Function Parameters
- **queue_name** (text) - Required - The name of the Queue
- **messages** (jsonb[]) - Required - Array of message payloads to send
- **sleep_seconds** (integer) - Optional - Delay messages visibility by specified seconds. Defaults to 0

### Request Example
```sql
SELECT pgmq_public.send_batch(
  'my_queue',
  ARRAY[
    '{"user_id": 123, "action": "process"}'::jsonb,
    '{"user_id": 456, "action": "notify"}'::jsonb
  ]::jsonb[],
  0
);
```

### Response
#### Success Response
- **message_id** (bigint[]) - Array of unique identifiers for the newly sent messages

#### Response Example
```json
{
  "message_ids": [42, 43]
}
```
```

--------------------------------

### Create Unlogged Queue for High Throughput

Source: https://supabase.com/docs/guides/queues/pgmq

Creates an unlogged queue table that prioritizes write throughput over durability. Useful for scenarios where performance is more critical than data persistence guarantees.

```sql
pgmq.create_unlogged(queue_name text) returns void
```

```sql
select pgmq.create_unlogged('my_unlogged');
```

--------------------------------

### pgmq_public.send() - Send Message to Queue

Source: https://supabase.com/docs/guides/queues/api

Adds a single message to a specified Queue with optional visibility delay. The delay parameter allows you to schedule message visibility for future consumption by all workers.

```APIDOC
## pgmq_public.send(queue_name, message, sleep_seconds)

### Description
Adds a Message to the specified Queue, optionally delaying its visibility to all consumers by a number of seconds.

### Function Signature
```
pgmq_public.send(queue_name text, message jsonb, sleep_seconds integer DEFAULT 0)
```

### Parameters
#### Function Parameters
- **queue_name** (text) - Required - The name of the Queue
- **message** (jsonb) - Required - Message payload to send
- **sleep_seconds** (integer) - Optional - Delay message visibility by specified seconds. Defaults to 0

### Request Example
```sql
SELECT pgmq_public.send('my_queue', '{"user_id": 123, "action": "process"}'::jsonb, 5);
```

### Response
#### Success Response
- **message_id** (bigint) - Unique identifier of the newly sent message

#### Response Example
```json
{
  "message_id": 42
}
```
```

--------------------------------

### Drop Queue in PGMQ

Source: https://supabase.com/docs/guides/queues/pgmq

Deletes a queue and its associated archive table. Returns a boolean indicating success. This operation removes all queue infrastructure.

```sql
pgmq.drop_queue(queue_name text) returns boolean
```

```sql
select * from pgmq.drop_queue('my_unlogged');
```

--------------------------------

### SQL Function Call pgmq.create

Source: https://supabase.com/docs/guides/queues/pgmq

Create a new message queue. This function initializes the necessary tables for a new queue.

```APIDOC
## SQL Function Call pgmq.create

### Description
Create a new message queue within the PGMQ extension. This sets up the required database structures for message handling.

### Method
SQL Function Call

### Endpoint
pgmq.create(queue_name text)

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No query parameters.

#### Request Body
- **queue_name** (text) - Required - The name of the queue to create.

### Request Example
```sql
select from pgmq.create('my_queue');
```

### Response
#### Success Response (void)
- Returns void upon successful creation.

#### Response Example
```
create--------
```
```

--------------------------------

### Archive PGMQ Messages (PostgreSQL)

Source: https://supabase.com/docs/guides/queues/pgmq

Archives a batch of messages from a specified PGMQ queue, moving them to the queue's archive. It returns an array of message IDs that were successfully archived. This function requires the `pgmq.archive` function and takes the queue name and an array of message IDs as input.

```sql
pgmq.archive(queue_name text, msg_ids bigint[])RETURNS SETOF bigint
```

```sql
select * from pgmq.archive('my_queue', array[1, 2]);
```

```sql
select * from pgmq.archive('my_queue', array[4, 999]);
```

--------------------------------

### Send Single Message to PGMQ Queue

Source: https://supabase.com/docs/guides/queues/pgmq

Sends a single JSON message to a queue with optional delay. Returns the message ID. The delay parameter specifies how many seconds before the message becomes visible to consumers.

```sql
pgmq.send(
    queue_name text,
    msg jsonb,
    delay integer default 0
) returns setof bigint
```

```sql
select * from pgmq.send('my_queue', '{"hello": "world"}');
```

--------------------------------

### Check Webhook Request Queue Size in SQL

Source: https://supabase.com/docs/guides/troubleshooting/interpreting-supabase-grafana-io-charts-MUynDR

Query the net.http_request_queue table to monitor webhook request backlog in Supabase. Returns the count of pending webhook requests; values should typically remain below 20,000. This helps identify when webhook-enabled tables are experiencing excessive read costs due to large data uploads.

```sql
select count(*) as exact_count from net.http_request_queue;
```

--------------------------------

### Consume and Process Supabase Queue Messages in Edge Function

Source: https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions

A complete Supabase Edge Function implementation that reads up to 5 messages from a queue, processes each message with custom logic, and deletes successfully processed messages. The function handles errors gracefully by logging failed deletions and returning appropriate HTTP responses. Messages that fail processing remain in the queue for retry on the next function execution.

```TypeScript
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = 'supabaseURL'
const supabaseKey = 'supabaseKey'
const supabase = createClient(supabaseUrl, supabaseKey)
const queueName = 'your_queue_name'

// Type definition for queue messages
interface QueueMessage {
  msg_id: bigint
  read_ct: number
  vt: string
  enqueued_at: string
  message: any
}

async function processMessage(message: QueueMessage) {
  // Do whatever logic you need to with the message content
  
  // Delete the message from the queue
  const { error: deleteError } = await supabase.schema('pgmq_public').rpc('delete', {
    queue_name: queueName,
    msg_id: message.msg_id,
  })
  
  if (deleteError) {
    console.error(`Failed to delete message ${message.msg_id}:`, deleteError)
  } else {
    console.log(`Message ${message.msg_id} deleted from queue`)
  }
}

Deno.serve(async (req) => {
  const { data: messages, error } = await supabase.schema('pgmq_public').rpc('read', {
    queue_name: queueName,
    sleep_seconds: 0, // Don't wait if queue is empty
    n: 5, // Read 5 messages off the queue
  })
  
  if (error) {
    console.error(`Error reading from ${queueName} queue:`, error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  
  if (!messages || messages.length === 0) {
    console.log('No messages in workflow_messages queue')
    return new Response(JSON.stringify({ message: 'No messages in queue' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  
  console.log(`Found ${messages.length} messages to process`)
  
  // Process each message that was read off the queue
  for (const message of messages) {
    try {
      await processMessage(message as QueueMessage)
    } catch (error) {
      console.error(`Error processing message ${message.msg_id}:`, error)
    }
  }
  
  // Return immediately while background processing continues
  return new Response(
    JSON.stringify({
      message: `Processing ${messages.length} messages in background`,
      count: messages.length,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
})
```

--------------------------------

### Clear Webhook Request Queue in Supabase

Source: https://supabase.com/docs/guides/troubleshooting/interpreting-supabase-grafana-io-charts-MUynDR

Truncate the net.http_request_queue table to clear accumulated webhook requests when experiencing high read costs from large data uploads. This operation removes all pending requests from the queue, allowing the system to reset and handle new requests more efficiently.

```sql
TRUNCATE net.http_request_queue;
```

--------------------------------

### pgmq_public.archive() - Archive Message

Source: https://supabase.com/docs/guides/queues/api

Moves a message from the main Queue table to the Queue's archive table. This is useful for retaining processed messages for audit trails or historical analysis without cluttering the active queue.

```APIDOC
## pgmq_public.archive(queue_name, message_id)

### Description
Archives a Message by moving it from the Queue table to the Queue's archive table.

### Function Signature
```
pgmq_public.archive(queue_name text, message_id bigint)
```

### Parameters
#### Function Parameters
- **queue_name** (text) - Required - The name of the Queue
- **message_id** (bigint) - Required - ID of the Message to archive

### Request Example
```sql
SELECT pgmq_public.archive('my_queue', 42);
```

### Response
#### Success Response
- **success** (boolean) - Indicates whether the archive operation completed successfully

#### Response Example
```json
{
  "success": true
}
```
```

--------------------------------

### HTTP Request Queue Table Structure

Source: https://supabase.com/docs/guides/database/extensions/pg_net

Defines the structure of net.http_request_queue, an unlogged table that stores pending HTTP requests until transaction commit. Requests are deleted from this table upon execution. This table holds method, URL, headers, body, and timeout information for each request.

```sql
CREATE UNLOGGED TABLE
    net.http_request_queue (
        id bigint NOT NULL DEFAULT nextval('net.http_request_queue_id_seq'::regclass),
        method text NOT NULL,
        url text NOT NULL,
        headers jsonb NOT NULL,
        body bytea NULL,
        timeout_milliseconds integer NOT NULL
    )
```

--------------------------------

### pgmq_public.read() - Read Messages with Visibility Timeout

Source: https://supabase.com/docs/guides/queues/api

Reads up to n messages from a specified Queue with a visibility timeout. Messages read are temporarily hidden from other consumers for the specified duration, allowing for processing without duplication.

```APIDOC
## pgmq_public.read(queue_name, sleep_seconds, n)

### Description
Reads up to "n" Messages from the specified Queue with an optional "sleep_seconds" (visibility timeout). Messages are not automatically deleted and remain in the queue.

### Function Signature
```
pgmq_public.read(queue_name text, sleep_seconds integer, n integer)
```

### Parameters
#### Function Parameters
- **queue_name** (text) - Required - The name of the Queue
- **sleep_seconds** (integer) - Required - Visibility timeout in seconds. Messages are hidden from other consumers for this duration
- **n** (integer) - Required - Maximum number of Messages to read

### Request Example
```sql
SELECT * FROM pgmq_public.read('my_queue', 30, 10);
```

### Response
#### Success Response
- **message_id** (bigint) - Unique identifier of the message
- **message** (jsonb) - The message payload
- **read_ct** (integer) - Number of times the message has been read
- **enqueued_at** (timestamp) - When the message was added to the queue
- **dequeued_at** (timestamp) - When the message was last read (NULL if never read)

#### Response Example
```json
[
  {
    "message_id": 1,
    "message": {"data": "example1"},
    "read_ct": 1,
    "enqueued_at": "2024-01-15T10:30:00Z",
    "dequeued_at": "2024-01-15T10:35:00Z"
  },
  {
    "message_id": 2,
    "message": {"data": "example2"},
    "read_ct": 0,
    "enqueued_at": "2024-01-15T10:40:00Z",
    "dequeued_at": null
  }
]
```
```

--------------------------------

### Purge All Messages from a PGMQ Queue (SQL)

Source: https://supabase.com/docs/guides/queues/pgmq

This SQL snippet shows how to permanently delete all messages within a specified PGMQ queue using the `purge_queue` function. This operation effectively clears the queue, returning the total count of messages that were removed. Use with caution, as this action is irreversible.

```SQL
purge_queue(queue_name text)
returns bigint
```

```SQL
select * from pgmq.purge_queue('my_queue');
```

--------------------------------

### SQL Function Call pgmq.send_batch

Source: https://supabase.com/docs/guides/queues/pgmq

Send one or more messages to a queue in a single operation.

```APIDOC
## SQL Function Call pgmq.send_batch

### Description
Sends an array of messages to the specified queue in a batch. A delay can be set for when these messages become visible.

### Method
SQL Function Call

### Endpoint
pgmq.send_batch(queue_name text, msgs jsonb[], delay integer default 0)

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No query parameters.

#### Request Body
- **queue_name** (text) - Required - The name of the queue to send messages to.
- **msgs** (jsonb[]) - Required - An array of messages (jsonb) to send.
- **delay** (integer) - Optional - Time in seconds before the messages become visible. Defaults to 0.

### Request Example
```sql
select * from pgmq.send_batch(
    'my_queue',
    array[
      '{"hello": "world_0"}'::jsonb,
      '{"hello": "world_1"}'::jsonb
    ]);
```

### Response
#### Success Response (setof bigint)
- Returns a set of message IDs (bigint) for all messages sent in the batch.

#### Response Example
```
send_batch------------          1          2
```
```

--------------------------------

### Read PGMQ Messages with Long-Polling (SQL)

Source: https://supabase.com/docs/guides/queues/pgmq

This SQL snippet demonstrates how to read messages from a PGMQ queue with long-polling capabilities. The `pgmq.read_with_poll` function allows waiting for a specified duration if no messages are immediately available, returning messages as soon as they arrive. It's ideal for consumer applications requiring real-time message processing with built-in backoff.

```SQL
pgmq.read_with_poll(
    queue_name text,
    vt integer,
    qty integer,
    max_poll_seconds integer default 5,
    poll_interval_ms integer default 100
)returns setof pgmq.message_record
```

```SQL
select * from pgmq.read_with_poll('my_queue', 1, 1, 5, 100);
```

--------------------------------

### Enqueue and Dequeue Messages with Supabase in JavaScript

Source: https://supabase.com/docs/guides/queues/quickstart

This JavaScript code snippet demonstrates how to send and retrieve messages from a Supabase queue using the `pgmq_public.rpc` functions. It illustrates both the `send` operation to enqueue a message with a custom payload and an optional delay, and the `pop` operation to dequeue the next available message.

```javascript
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'supabaseURL'
const supabaseKey = 'supabaseKey'
const supabase = createClient(supabaseUrl, supabaseKey)

const QueuesTest: React.FC = () => {
  //Add a Message
  const sendToQueue = async () => {
    const result = await supabase.schema('pgmq_public').rpc('send', {
      queue_name: 'foo',
      message: { hello: 'world' },
      sleep_seconds: 30,
    })
    console.log(result)
  }

  //Dequeue Message
  const popFromQueue = async () => {
    const result = await supabase.schema('pgmq_public').rpc('pop', { queue_name: 'foo' })
    console.log(result)
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Queue Test Component</h2>
      <button
        onClick={sendToQueue}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
      >
        Add Message
      </button>
      <button
        onClick={popFromQueue}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Pop Message
      </button>
    </div>
  )
}

export default QueuesTest
```

--------------------------------

### Generic Trigger Function to Queue Embeddings

Source: https://supabase.com/docs/guides/ai/automatic-embeddings

Creates a reusable trigger function that queues embedding jobs whenever records are inserted or updated. Accepts two arguments: the content function name that generates text to embed, and the destination embedding column name. The function builds a JSON message containing the record ID, schema, table name, and embedding parameters.

```sql
create or replace function util.queue_embeddings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  content_function text = TG_ARGV[0];
  embedding_column text = TG_ARGV[1];
begin
  perform pgmq.send(
    queue_name => 'embedding_jobs',
    msg => jsonb_build_object(
      'id', NEW.id,
      'schema', TG_TABLE_SCHEMA,
      'table', TG_TABLE_NAME,
      'contentFunction', content_function,
      'embeddingColumn', embedding_column
    )
  );
  return NEW;
end;
$$;
```

--------------------------------

### Read Messages from PGMQ Queue

Source: https://supabase.com/docs/guides/queues/pgmq

Reads one or more messages from a queue and marks them as invisible for the specified visibility timeout (vt) duration. Returns message records with metadata including msg_id, read_ct, enqueued_at, vt, and message content.

```sql
pgmq.read(
    queue_name text,
    vt integer,
    qty integer
) returns setof pgmq.message_record
```

```sql
select * from pgmq.read('my_queue', 10, 2);
```

--------------------------------

### Pop a Single Message from PGMQ Queue (SQL)

Source: https://supabase.com/docs/guides/queues/pgmq

This SQL snippet shows how to read and immediately delete a single message from a PGMQ queue using the `pgmq.pop` function. This operation provides at-most-once delivery semantics, meaning a message is removed from the queue upon being read. Consumers should ensure message processing guarantees if stricter delivery semantics are required.

```SQL
pgmq.pop(queue_name text)
returns setof pgmq.message_record
```

```SQL
select * from pgmq.pop('my_queue');
```

--------------------------------

### SQL Function Call pgmq.drop_queue

Source: https://supabase.com/docs/guides/queues/pgmq

Deletes a queue and its associated archive table permanently.

```APIDOC
## SQL Function Call pgmq.drop_queue

### Description
Deletes a specified queue and its corresponding archive table from the database.

### Method
SQL Function Call

### Endpoint
pgmq.drop_queue(queue_name text)

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No query parameters.

#### Request Body
- **queue_name** (text) - Required - The name of the queue to drop.

### Request Example
```sql
select * from pgmq.drop_queue('my_unlogged');
```

### Response
#### Success Response (boolean)
- Returns `true` if the queue was successfully dropped.

#### Response Example
```
drop_queue------------ t
```
```

--------------------------------

### SQL Function Call pgmq.send

Source: https://supabase.com/docs/guides/queues/pgmq

Send a single message to a specified queue.

```APIDOC
## SQL Function Call pgmq.send

### Description
Sends a single message to the designated queue. Optionally, a delay can be specified before the message becomes visible to consumers.

### Method
SQL Function Call

### Endpoint
pgmq.send(queue_name text, msg jsonb, delay integer default 0)

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No query parameters.

#### Request Body
- **queue_name** (text) - Required - The name of the queue to send the message to.
- **msg** (jsonb) - Required - The message content, formatted as JSONB.
- **delay** (integer) - Optional - Time in seconds before the message becomes visible. Defaults to 0.

### Request Example
```sql
select * from pgmq.send('my_queue', '{"hello": "world"}');
```

### Response
#### Success Response (bigint)
- Returns the message ID (bigint) of the sent message.

#### Response Example
```
send------    4
```
```

--------------------------------

### SQL Function Call pgmq.read

Source: https://supabase.com/docs/guides/queues/pgmq

Read one or more messages from a queue, making them invisible for a specified duration (visibility timeout).

```APIDOC
## SQL Function Call pgmq.read

### Description
Reads a specified quantity of messages from a queue and sets a visibility timeout (VT) for them. During the VT, messages are invisible to other consumers.

### Method
SQL Function Call

### Endpoint
pgmq.read(queue_name text, vt integer, qty integer)

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No query parameters.

#### Request Body
- **queue_name** (text) - Required - The name of the queue to read messages from.
- **vt** (integer) - Required - The visibility timeout in seconds, during which read messages are invisible.
- **qty** (integer) - Optional - The number of messages to read. Defaults to 1 if not specified.

### Request Example
```sql
select * from pgmq.read('my_queue', 10, 2);
```

### Response
#### Success Response (setof pgmq.message_record)
- Returns a set of message records, each containing details like `msg_id`, `read_ct`, `enqueued_at`, `vt`, and the `message` content.

#### Response Example
```
 msg_id | read_ct |          enqueued_at          |              vt               |       message
--------+---------+-------------------------------+-------------------------------+----------------------
      1 |       1 | 2023-10-28 19:14:47.356595-05 | 2023-10-28 19:17:08.608922-05 | {"hello": "world_0"}
      2 |       1 | 2023-10-28 19:14:47.356595-05 | 2023-10-28 19:17:08.608974-05 | {"hello": "world_1"}
(2 rows)
```
```

--------------------------------

### SQL Function Call pgmq.create_unlogged

Source: https://supabase.com/docs/guides/queues/pgmq

Create a new unlogged message queue. Unlogged tables offer higher write throughput but are not crash-safe.

```APIDOC
## SQL Function Call pgmq.create_unlogged

### Description
Creates an unlogged queue, which prioritizes write throughput over durability. Refer to PostgreSQL documentation for details on unlogged tables.

### Method
SQL Function Call

### Endpoint
pgmq.create_unlogged(queue_name text)

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No query parameters.

#### Request Body
- **queue_name** (text) - Required - The name of the unlogged queue to create.

### Request Example
```sql
select pgmq.create_unlogged('my_unlogged');
```

### Response
#### Success Response (void)
- Returns void upon successful creation of the unlogged queue.

#### Response Example
```
create_unlogged-----------------
```
```

--------------------------------

### Set PGMQ Message Visibility Timeout (PostgreSQL)

Source: https://supabase.com/docs/guides/queues/pgmq

Modifies the visibility timeout for a specific message in a PGMQ queue. The timeout is set for a duration relative to the current time. It returns the updated message record. This function requires `pgmq.set_vt` and inputs include the queue name, message ID, and the offset in seconds.

```sql
pgmq.set_vt(
    queue_name text,
    msg_id bigint,
    vt_offset integer)returns pgmq.message_record
```

```sql
select * from pgmq.set_vt('my_queue', 11, 30);
```

--------------------------------

### purge_queue - Delete All Messages

Source: https://supabase.com/docs/guides/queues/pgmq

Permanently deletes all messages in a queue. Returns the total number of messages that were deleted.

```APIDOC
## purge_queue

### Description
Permanently deletes all messages in a queue. Returns the number of messages that were deleted.

### Function Signature
```
purge_queue(queue_name text) returns bigint
```

### Parameters
- **queue_name** (text) - Required - The name of the queue

### Returns
- **bigint** - The number of messages that were deleted

### Request Example
```sql
select * from pgmq.purge_queue('my_queue');
```

### Response Example
```
purge_queue
-------------
           8
```

**Note:** In this example, the queue contained 8 messages which were all deleted.
```

--------------------------------

### Delete Multiple PGMQ Messages by IDs (SQL)

Source: https://supabase.com/docs/guides/queues/pgmq

This SQL snippet illustrates how to delete multiple messages from a PGMQ queue by providing an array of message IDs. The `pgmq.delete` function processes the list and returns the message IDs that were successfully deleted. This batch operation is efficient for removing several messages at once.

```SQL
pgmq.delete (queue_name text, msg_ids: bigint[])
returns setof bigint
```

```SQL
select * from pgmq.delete('my_queue', array[2, 3]);
```

```SQL
select * from pgmq.delete('my_queue', array[6, 999]);
```

--------------------------------

### pgmq_public.pop() - Retrieve and Delete Message

Source: https://supabase.com/docs/guides/queues/api

Retrieves the next available message from a specified Queue and automatically deletes it. This is useful for consuming messages in a FIFO manner where you want immediate removal after retrieval.

```APIDOC
## pgmq_public.pop(queue_name)

### Description
Retrieves the next available message and deletes it from the specified Queue.

### Function Signature
```
pgmq_public.pop(queue_name text)
```

### Parameters
#### Function Parameters
- **queue_name** (text) - Required - The name of the Queue to retrieve a message from

### Request Example
```sql
SELECT * FROM pgmq_public.pop('my_queue');
```

### Response
#### Success Response
- **message_id** (bigint) - Unique identifier of the message
- **message** (jsonb) - The message payload
- **read_ct** (integer) - Number of times the message was read
- **enqueued_at** (timestamp) - When the message was added to the queue
- **dequeued_at** (timestamp) - When the message was dequeued

#### Response Example
```json
{
  "message_id": 1,
  "message": {"data": "example"},
  "read_ct": 1,
  "enqueued_at": "2024-01-15T10:30:00Z",
  "dequeued_at": "2024-01-15T10:35:00Z"
}
```
```

--------------------------------

### delete - Delete Batch Messages

Source: https://supabase.com/docs/guides/queues/pgmq

Deletes one or many messages from a queue in a single operation. Returns the set of message IDs that were successfully deleted.

```APIDOC
## delete (Batch Messages)

### Description
Deletes one or many messages from a queue. Returns the set of message IDs that were successfully deleted. Non-existent message IDs are silently ignored.

### Function Signature
```
pgmq.delete(queue_name text, msg_ids bigint[]) returns setof bigint
```

### Parameters
- **queue_name** (text) - Required - The name of the queue
- **msg_ids** (bigint[]) - Required - Array of message IDs to delete

### Returns
- **setof bigint** - Set of message IDs that were successfully deleted

### Request Example (All Messages Exist)
```sql
select * from pgmq.delete('my_queue', array[2, 3]);
```

### Response Example (All Messages Exist)
```
delete
--------
      2
      3
```

### Request Example (Mixed Existence)
```sql
select * from pgmq.delete('my_queue', array[6, 999]);
```

### Response Example (Mixed Existence)
```
delete
--------
      6
```

**Note:** Message ID 999 does not exist and is not returned in the result set.
```

--------------------------------

### Batch Process Embeddings Function with Cron Scheduling

Source: https://supabase.com/docs/guides/ai/automatic-embeddings

Creates a function that reads embedding jobs from the queue in batches, groups them, and invokes an Edge Function to generate embeddings. Includes configurable batch size, maximum requests, and timeout parameters. Also schedules the function to run every 10 seconds using pg_cron for automatic asynchronous processing.

```sql
create or replace function util.process_embeddings(
  batch_size int = 10,
  max_requests int = 10,
  timeout_milliseconds int = 5 * 60 * 1000 -- default 5 minute timeout
)
returns void
language plpgsql
as $$
declare
  job_batches jsonb[];
  batch jsonb;
begin
  with
    -- First get jobs and assign batch numbers
    numbered_jobs as (
      select
        message || jsonb_build_object('jobId', msg_id) as job_info,
        (row_number() over (order by 1) - 1) / batch_size as batch_num
      from pgmq.read(
        queue_name => 'embedding_jobs',
        vt => timeout_milliseconds / 1000,
        qty => max_requests * batch_size
      )
    ),
    -- Then group jobs into batches
    batched_jobs as (
      select
        jsonb_agg(job_info) as batch_array,
        batch_num
      from numbered_jobs
      group by batch_num
    )
  -- Finally aggregate all batches into array
  select array_agg(batch_array)
  from batched_jobs
  into job_batches;

  -- Invoke the embed edge function for each batch
  foreach batch in array job_batches loop
    perform util.invoke_edge_function(
      name => 'embed',
      body => batch,
      timeout_milliseconds => timeout_milliseconds
    );
  end loop;
end;
$$;

-- Schedule the embedding processing
select
  cron.schedule(
    'process-embeddings',
    '10 seconds',
    $$
    select util.process_embeddings();
    $$
  );
```

--------------------------------

### pop - Read and Delete Message

Source: https://supabase.com/docs/guides/queues/pgmq

Reads a single message from a queue and immediately deletes it. Provides at-most-once delivery semantics if the consuming application guarantees message processing.

```APIDOC
## pop

### Description
Reads a single message from a queue and deletes it upon read. Utilization of pop() results in at-most-once delivery semantics if the consuming application does not guarantee processing of the message.

### Function Signature
```
pgmq.pop(queue_name text) returns setof pgmq.message_record
```

### Parameters
- **queue_name** (text) - Required - The name of the queue

### Returns
- **setof pgmq.message_record** - Single message record containing: msg_id, read_ct, enqueued_at, vt, message

### Request Example
```sql
select * from pgmq.pop('my_queue');
```

### Response Example
```
msg_id | read_ct |          enqueued_at          |              vt               |      message
-------+---------+-------------------------------+-------------------------------+--------------------
      1 |       2 | 2023-10-28 19:09:09.177756-05 | 2023-10-28 19:27:00.337929-05 | {"hello": "world"}
```
```

--------------------------------

### Message Record Type Structure - pgmq Data Type

Source: https://supabase.com/docs/guides/queues/pgmq

Defines the message_record type which represents the complete structure of a message within a pgmq queue. Contains metadata about the message including its unique identifier, read count, timestamps for enqueueing and visibility, and the JSON message payload.

```SQL
msg_id | read_ct |          enqueued_at          |              vt               |      message
--------+---------+-------------------------------+-------------------------------+--------------------
      1 |       1 | 2023-10-28 19:06:19.941509-05 | 2023-10-28 19:06:27.419392-05 | {"hello": "world"}
```

--------------------------------

### POST /bucket/{bucketId}/empty

Source: https://supabase.com/docs/reference/self-hosting-storage/copies-an-object

Empties all objects from a specific storage bucket, queueing the operation.

```APIDOC
## POST /bucket/{bucketId}/empty

### Description
Empties all objects from a specific storage bucket, queueing the operation.

### Method
POST

### Endpoint
/bucket/{bucketId}/empty

### Parameters
#### Path Parameters
- **bucketId** (string) - Required - The ID of the bucket to empty.

### Request Example
{}

### Response
#### Success Response (200)
- **message** (string) - A confirmation message that the empty operation has been queued.

#### Response Example
{
  "message": "Empty bucket has been queued. Completion may take up to an hour."
}
```

--------------------------------

### pgmq_public.delete() - Delete Message Permanently

Source: https://supabase.com/docs/guides/queues/api

Permanently deletes a message from the specified Queue. Unlike archiving, this operation completely removes the message and cannot be undone. Use when you want to discard processed or unwanted messages.

```APIDOC
## pgmq_public.delete(queue_name, message_id)

### Description
Permanently deletes a Message from the specified Queue.

### Function Signature
```
pgmq_public.delete(queue_name text, message_id bigint)
```

### Parameters
#### Function Parameters
- **queue_name** (text) - Required - The name of the Queue
- **message_id** (bigint) - Required - ID of the Message to delete

### Request Example
```sql
SELECT pgmq_public.delete('my_queue', 42);
```

### Response
#### Success Response
- **success** (boolean) - Indicates whether the delete operation completed successfully

#### Response Example
```json
{
  "success": true
}
```
```

--------------------------------

### Archive a Single PGMQ Message (SQL)

Source: https://supabase.com/docs/guides/queues/pgmq

This SQL snippet demonstrates how to move a specific message from a PGMQ queue to its associated archive using the `pgmq.archive` function. This is useful for retaining messages that have been processed or are no longer needed in the active queue but should be preserved for auditing or historical purposes. The function returns a boolean indicating success.

```SQL
pgmq.archive(queue_name text, msg_id bigint)
returns boolean
```

```SQL
select * from pgmq.archive('my_queue', 1);
```

--------------------------------

### Detach Archive from PGMQ Queue

Source: https://supabase.com/docs/guides/queues/pgmq

Removes the queue's archive table as a member of the PGMQ extension, preventing it from being dropped when the extension is removed. The archive table remains functional for further archival operations.

```sql
pgmq.detach_archive(queue_name text)
```

```sql
select * from pgmq.detach_archive('my_queue');
```

--------------------------------

### Type Definition - message_record

Source: https://supabase.com/docs/guides/queues/pgmq

Defines the complete structure of a message record in a PGMQ queue. This type represents all attributes associated with a message including its ID, read count, timestamps, and payload.

```APIDOC
## message_record Type

### Description
The complete representation of a message in a queue. This type defines the structure of message records stored in PGMQ queues.

### Type Definition

#### Attributes
- **msg_id** (bigint) - Unique ID of the message
- **read_ct** (bigint) - Number of times the message has been read. Increments on read()
- **enqueued_at** (timestamp with time zone) - Time that the message was inserted into the queue
- **vt** (timestamp with time zone) - Timestamp when the message will become available for consumers to read
- **message** (jsonb) - The message payload

#### Example Record
```
 msg_id | read_ct |          enqueued_at          |              vt               |      message
--------+---------+-------------------------------+-------------------------------+--------------------
      1 |       1 | 2023-10-28 19:06:19.941509-05 | 2023-10-28 19:06:27.419392-05 | {"hello": "world"}
```
```

--------------------------------

### Delete a Single PGMQ Message by ID (SQL)

Source: https://supabase.com/docs/guides/queues/pgmq

This SQL snippet demonstrates deleting a specific message from a PGMQ queue using its message ID. The `pgmq.delete` function takes the queue name and the message identifier as arguments. It returns a boolean indicating the success or failure of the deletion operation.

```SQL
pgmq.delete (queue_name text, msg_id: bigint)
returns boolean
```

```SQL
select pgmq.delete('my_queue', 5);
```

--------------------------------

### archive - Archive Single Message

Source: https://supabase.com/docs/guides/queues/pgmq

Removes a single message from a queue and inserts it into the queue's archive table. Useful for preserving message history while removing active messages.

```APIDOC
## archive (Single Message)

### Description
Removes a single requested message from the specified queue and inserts it into the queue's archive table. Provides a way to preserve message history while keeping the active queue clean.

### Function Signature
```
pgmq.archive(queue_name text, msg_id bigint) returns boolean
```

### Parameters
- **queue_name** (text) - Required - The name of the queue
- **msg_id** (bigint) - Required - Message ID of the message to archive

### Returns
- **boolean** - True if archival was successful, false otherwise

### Request Example
```sql
select * from pgmq.archive('my_queue', 1);
```

### Response Example
```
archive
---------
       t
```

**Note:** The message with ID 1 is removed from 'my_queue' and moved to its archive table.
```

--------------------------------

### SQL Function Call pgmq.detach_archive

Source: https://supabase.com/docs/guides/queues/pgmq

Detach a queue's archive table from the PGMQ extension. This prevents the archive table from being dropped when the extension is dropped.

```APIDOC
## SQL Function Call pgmq.detach_archive

### Description
Detaches the archive table associated with a specified queue from the PGMQ extension. This means the archive table will not be dropped if the PGMQ extension itself is dropped.

### Method
SQL Function Call

### Endpoint
pgmq.detach_archive(queue_name text)

### Parameters
#### Path Parameters
- No path parameters.

#### Query Parameters
- No query parameters.

#### Request Body
- **queue_name** (text) - Required - The name of the queue whose archive table should be detached.

### Request Example
```sql
select * from pgmq.detach_archive('my_queue');
```

### Response
#### Success Response (void)
- Returns void upon successful detachment.

#### Response Example
```
detach_archive----------------
```
```